import os
import json
import uuid
import shutil
import base64
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import get_supabase
import schemas
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_optional_current_user,
    require_admin,
    require_client_or_admin,
)

app = FastAPI(
    title="Kalaga Wealth API",
    description="High-conviction market research & investor community portal powered by Supabase.",
    version="2.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory for user display pictures and post media
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# --- Helper to format poll response with percentage calculations ---
def format_poll_from_supabase(poll_record: dict, user_id: Optional[str] = None) -> schemas.PollResponse:
    poll_id = poll_record["id"]
    options = poll_record.get("poll_options", [])
    votes = poll_record.get("poll_votes", [])
    total_votes = len(votes)

    user_voted_option_id = None
    if user_id:
        for v in votes:
            if str(v.get("user_id")) == str(user_id):
                user_voted_option_id = v.get("option_id")
                break

    options_data = []
    for opt in options:
        opt_id = opt["id"]
        opt_votes = sum(1 for v in votes if str(v.get("option_id")) == str(opt_id))
        pct = round((opt_votes / total_votes * 100), 1) if total_votes > 0 else 0.0
        options_data.append(schemas.PollOptionResponse(
            id=opt_id,
            text=opt.get("text", ""),
            vote_count=opt_votes,
            percentage=pct
        ))

    # Parse question and optional description
    full_q = poll_record.get("question", "")
    description = poll_record.get("description")
    if not description and "\n\n---\n\n" in full_q:
        parts = full_q.split("\n\n---\n\n", 1)
        question = parts[0]
        description = parts[1]
    else:
        question = full_q

    return schemas.PollResponse(
        id=poll_id,
        post_id=poll_record.get("post_id"),
        question=question,
        description=description,
        created_by=poll_record.get("created_by", ""),
        created_at=poll_record.get("created_at"),
        options=options_data,
        total_votes=total_votes,
        user_voted_option_id=user_voted_option_id
    )


# --- Helper to format post response ---
def format_post_from_supabase(post_record: dict, poll_record: Optional[dict] = None, user_id: Optional[str] = None) -> schemas.PostResponse:
    raw_media = post_record.get("media_urls")
    urls = []
    is_featured = bool(post_record.get("is_featured", False))

    if isinstance(raw_media, dict):
        urls = raw_media.get("urls", [])
        if "is_featured" in raw_media:
            is_featured = bool(raw_media["is_featured"])
    elif isinstance(raw_media, list):
        urls = raw_media
    elif isinstance(raw_media, str):
        try:
            parsed = json.loads(raw_media)
            if isinstance(parsed, dict):
                urls = parsed.get("urls", [])
                is_featured = bool(parsed.get("is_featured", is_featured))
            elif isinstance(parsed, list):
                urls = parsed
            else:
                urls = [raw_media]
        except Exception:
            urls = [raw_media]

    # Author profile from public.profiles
    author_data = post_record.get("author") or {}
    if not author_data and "profiles" in post_record:
        author_data = post_record["profiles"]

    if not author_data:
        author_data = {
            "id": post_record.get("author_id", "unknown"),
            "email": "pavan@kalagawealth.com",
            "full_name": "Kalaga Pavan Kishore",
            "role": "admin",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
        }

    formatted_poll = None
    if poll_record:
        formatted_poll = format_poll_from_supabase(poll_record, user_id)

    return schemas.PostResponse(
        id=post_record["id"],
        title=post_record.get("title", ""),
        content=post_record.get("content", ""),
        media_urls=urls,
        media_type=post_record.get("media_type", "none"),
        is_featured=is_featured,
        author=schemas.UserResponse.from_user(author_data),
        poll=formatted_poll,
        created_at=post_record.get("created_at"),
        updated_at=post_record.get("updated_at")
    )


# --- AUTHENTICATION ENDPOINTS (STICK WITH SUPABASE ONLY) ---

@app.post("/api/auth/register", response_model=schemas.Token)
def register(user_in: schemas.UserCreate):
    clean_email = user_in.email.strip().lower()
    sb = get_supabase()

    # STRICT RULE: No admin accounts other than Kalaga Pavan Kishore
    if user_in.role == "admin" or clean_email == "pavan@kalagawealth.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account creation is strictly forbidden. Kalaga Pavan Kishore is the sole administrator of Kalaga Wealth."
        )

    # Check if user already exists in Supabase public.profiles
    existing = sb.table("profiles").select("id").eq("email", clean_email).execute()
    if existing.data and len(existing.data) > 0:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    # Create user in Supabase Auth via Admin API (bypasses email rate limits)
    try:
        user_meta = {
            "full_name": user_in.full_name,
            "role": "client",
            "avatar_url": user_in.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={clean_email}"
        }
        sb_user = sb.auth.admin.create_user({
            "email": clean_email,
            "password": user_in.password,
            "email_confirm": True,
            "user_metadata": user_meta
        })
        user_id = sb_user.user.id
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

    # Fetch newly created profile from public.profiles (populated via trigger)
    prof_res = sb.table("profiles").select("*").eq("id", user_id).execute()
    profile = prof_res.data[0] if prof_res.data else {
        "id": user_id,
        "email": clean_email,
        "full_name": user_in.full_name,
        "role": "client",
        "avatar_url": user_meta["avatar_url"]
    }

    token = create_access_token({"sub": user_id, "email": clean_email, "role": "client"})
    return schemas.Token(
        access_token=token,
        token_type="bearer",
        user=schemas.UserResponse.from_user(profile)
    )


@app.post("/api/auth/login", response_model=schemas.Token)
def login(login_data: schemas.LoginRequest):
    clean_email = login_data.email.strip().lower()
    sb = get_supabase()

    try:
        auth_res = sb.auth.sign_in_with_password({
            "email": clean_email,
            "password": login_data.password
        })
        user_id = auth_res.user.id
        access_token = auth_res.session.access_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Fetch profile from public.profiles table
    prof_res = sb.table("profiles").select("*").eq("id", user_id).execute()
    if prof_res.data and len(prof_res.data) > 0:
        profile = prof_res.data[0]
    else:
        is_sole_admin = (clean_email == "pavan@kalagawealth.com")
        profile = {
            "id": user_id,
            "email": clean_email,
            "full_name": "Kalaga Pavan Kishore" if is_sole_admin else clean_email.split("@")[0],
            "role": "admin" if is_sole_admin else "client",
            "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={clean_email}"
        }

    # Sole Admin Invariant
    if clean_email == "pavan@kalagawealth.com":
        profile["role"] = "admin"
    else:
        profile["role"] = "client"

    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserResponse.from_user(profile)
    )


@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return schemas.UserResponse.from_user(current_user)


# --- USER DISPLAY PICTURE (DP) & PROFILE UPDATE ---

@app.post("/api/users/avatar")
async def upload_user_avatar(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    content_type = request.headers.get("content-type", "")
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    filename = None

    # 1. Handle multipart form-data
    if "multipart/form-data" in content_type:
        try:
            form = await request.form()
            file = form.get("file") or form.get("avatar")
            if file and hasattr(file, "filename") and file.filename:
                ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
                if ext not in allowed_extensions:
                    raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

                safe_user_id = "".join([c for c in current_user["id"] if c.isalnum() or c in "-_"])[:16]
                filename = f"avatar_{safe_user_id}_{uuid.uuid4().hex[:8]}{ext}"
                file_path = os.path.join(UPLOAD_DIR, filename)

                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
        except RuntimeError:
            pass

    # 2. Handle base64 JSON payload
    if not filename:
        try:
            data = await request.json()
            content_b64 = data.get("image_base64") or data.get("content_base64") or data.get("avatar_base64", "")
            orig_name = data.get("filename", "avatar.jpg")
            ext = os.path.splitext(orig_name)[1].lower() or ".jpg"
            if ext not in allowed_extensions:
                ext = ".jpg"

            if "," in content_b64:
                content_b64 = content_b64.split(",")[1]

            if not content_b64:
                raise HTTPException(status_code=400, detail="No image data provided")

            safe_user_id = "".join([c for c in current_user["id"] if c.isalnum() or c in "-_"])[:16]
            filename = f"avatar_{safe_user_id}_{uuid.uuid4().hex[:8]}{ext}"
            file_path = os.path.join(UPLOAD_DIR, filename)

            with open(file_path, "wb") as f:
                f.write(base64.b64decode(content_b64))
        except Exception as e:
            if not filename:
                raise HTTPException(status_code=400, detail=f"Failed to process avatar upload: {str(e)}")

    new_avatar_url = f"/uploads/{filename}"

    # Update in Supabase public.profiles table
    sb = get_supabase()
    sb.table("profiles").update({"avatar_url": new_avatar_url}).eq("id", current_user["id"]).execute()

    # Update in Supabase auth user_metadata
    try:
        sb.auth.admin.update_user_by_id(current_user["id"], {"user_metadata": {"avatar_url": new_avatar_url}})
    except Exception:
        pass

    current_user["avatar_url"] = new_avatar_url
    return {
        "status": "success",
        "avatar_url": new_avatar_url,
        "user": schemas.UserResponse.from_user(current_user)
    }


@app.patch("/api/users/profile", response_model=schemas.UserResponse)
def update_user_profile(
    profile_in: schemas.ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    sb = get_supabase()
    updates = {}
    if profile_in.avatar_url is not None:
        updates["avatar_url"] = profile_in.avatar_url
        current_user["avatar_url"] = profile_in.avatar_url
    if profile_in.full_name is not None and profile_in.full_name.strip():
        # Do not allow changing Sole Admin's name unless authorized
        if current_user.get("email") != "pavan@kalagawealth.com" or profile_in.full_name.strip():
            updates["full_name"] = profile_in.full_name.strip()
            current_user["full_name"] = profile_in.full_name.strip()

    if updates:
        sb.table("profiles").update(updates).eq("id", current_user["id"]).execute()

    return schemas.UserResponse.from_user(current_user)


# --- ADMIN CLIENT MANAGEMENT ENDPOINTS (SOLE ADMIN ONLY) ---

@app.get("/api/admin/clients", response_model=List[schemas.ClientResponse])
def get_admin_clients(
    current_user: dict = Depends(require_admin)
):
    """
    Returns all registered client accounts with their participation stats.
    Strictly restricted to Sole Administrator (Kalaga Pavan Kishore).
    """
    sb = get_supabase()
    # Fetch all profiles
    profiles_res = sb.table("profiles").select("*").order("created_at", desc=True).execute()
    profiles = profiles_res.data or []

    # Fetch votes count per user
    votes_res = sb.table("poll_votes").select("user_id").execute()
    votes_data = votes_res.data or []
    vote_counts = {}
    for v in votes_data:
        uid = str(v.get("user_id"))
        vote_counts[uid] = vote_counts.get(uid, 0) + 1

    clients = []
    for p in profiles:
        email = (p.get("email") or "").lower()
        role = p.get("role", "client")
        # Do not include the Sole Administrator in the clients list
        if email == "pavan@kalagawealth.com" or role == "admin":
            continue

        p_copy = dict(p)
        p_copy["votes_count"] = vote_counts.get(str(p["id"]), 0)
        clients.append(p_copy)

    return clients


@app.patch("/api/admin/clients/{client_id}", response_model=schemas.ClientResponse)
def update_admin_client(
    client_id: str,
    update_data: schemas.ClientUpdateRequest,
    current_user: dict = Depends(require_admin)
):
    """
    Update a client's information (e.g. full_name, avatar_url).
    Strictly restricted to Sole Administrator.
    """
    sb = get_supabase()
    try:
        target_res = sb.table("profiles").select("*").eq("id", client_id).execute()
    except Exception:
        raise HTTPException(status_code=404, detail="Client not found")

    if not target_res.data:
        raise HTTPException(status_code=404, detail="Client not found")

    target = target_res.data[0]
    if target.get("email", "").lower() == "pavan@kalagawealth.com" or target.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Cannot modify administrator account via client management.")

    updates = {}
    if update_data.full_name is not None and update_data.full_name.strip():
        updates["full_name"] = update_data.full_name.strip()
    if update_data.avatar_url is not None:
        updates["avatar_url"] = update_data.avatar_url

    if updates:
        sb.table("profiles").update(updates).eq("id", client_id).execute()
        try:
            sb.auth.admin.update_user_by_id(client_id, {"user_metadata": updates})
        except Exception:
            pass
        target.update(updates)

    # Get votes count
    votes_res = sb.table("poll_votes").select("id").eq("user_id", client_id).execute()
    target["votes_count"] = len(votes_res.data or [])

    return target


@app.delete("/api/admin/clients/{client_id}")
def delete_admin_client(
    client_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Permanently delete a client account, including their profile, poll votes, and auth record.
    Strictly restricted to Sole Administrator.
    """
    sb = get_supabase()
    try:
        target_res = sb.table("profiles").select("*").eq("id", client_id).execute()
    except Exception:
        raise HTTPException(status_code=404, detail="Client not found")

    if not target_res.data:
        raise HTTPException(status_code=404, detail="Client not found")

    target = target_res.data[0]
    target_email = target.get("email", "").lower()
    target_name = target.get("full_name", "Client")

    # Guard: Sole Admin can NEVER be deleted
    if target_email == "pavan@kalagawealth.com" or target.get("role") == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The Sole Administrator account (Kalaga Pavan Kishore) cannot be deleted."
        )

    # 1. Clean up poll votes
    try:
        sb.table("poll_votes").delete().eq("user_id", client_id).execute()
    except Exception as e:
        print(f"Error deleting poll votes for user {client_id}: {e}")

    # 2. Delete from public.profiles
    try:
        sb.table("profiles").delete().eq("id", client_id).execute()
    except Exception as e:
        print(f"Error deleting profile for user {client_id}: {e}")

    # 3. Delete from Supabase Auth
    try:
        sb.auth.admin.delete_user(client_id)
    except Exception as e:
        print(f"Notice: Supabase Auth delete_user for {client_id}: {e}")

    return {
        "status": "success",
        "message": f"Client '{target_name}' ({target_email}) has been permanently deleted.",
        "deleted_id": client_id
    }


# --- POSTS / BLOGS ENDPOINTS (POWERED BY SUPABASE) ---

@app.get("/api/posts", response_model=List[schemas.PostResponse])
def get_posts(
    featured: Optional[bool] = None,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    sb = get_supabase()

    # Featured preview posts on the Home Page are visible to everyone
    if featured is True:
        posts_res = sb.table("posts").select("*, author:profiles(*)").order("created_at", desc=True).execute()
        polls_res = sb.table("polls").select("*, poll_options(*), poll_votes(*)").execute()
        polls_by_post = {p["post_id"]: p for p in polls_res.data if p.get("post_id")}

        user_id = current_user["id"] if current_user else None
        formatted = []
        for post in posts_res.data:
            poll_obj = polls_by_post.get(post["id"])
            formatted_post = format_post_from_supabase(post, poll_obj, user_id)
            if formatted_post.is_featured:
                formatted.append(formatted_post)

        # Fallback to top posts if none explicitly featured
        if not formatted and posts_res.data:
            for post in posts_res.data[:2]:
                poll_obj = polls_by_post.get(post["id"])
                p_item = format_post_from_supabase(post, poll_obj, user_id)
                p_item.is_featured = True
                formatted.append(p_item)
        return formatted

    # The full single scroll research feed strictly requires authentication
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Only logged-in members can access the single scroll feed."
        )

    posts_res = sb.table("posts").select("*, author:profiles(*)").order("created_at", desc=True).execute()
    polls_res = sb.table("polls").select("*, poll_options(*), poll_votes(*)").execute()
    polls_by_post = {p["post_id"]: p for p in polls_res.data if p.get("post_id")}

    return [
        format_post_from_supabase(p, polls_by_post.get(p["id"]), current_user["id"])
        for p in posts_res.data
    ]


@app.post("/api/posts", response_model=schemas.PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_in: schemas.PostCreate,
    admin_user: dict = Depends(require_admin)
):
    sb = get_supabase()

    media_payload = {
        "urls": post_in.media_urls or [],
        "is_featured": bool(post_in.is_featured)
    }

    insert_data = {
        "title": post_in.title,
        "content": post_in.content,
        "media_urls": media_payload,
        "media_type": post_in.media_type or "none",
        "author_id": admin_user["id"]
    }

    post_res = sb.table("posts").insert(insert_data).select("*, author:profiles(*)").execute()
    if not post_res.data:
        raise HTTPException(status_code=500, detail="Failed to create post in Supabase")
    created_post = post_res.data[0]

    # Create attached poll if provided
    created_poll = None
    if post_in.poll:
        poll_q = post_in.poll.question
        if post_in.poll.description:
            poll_q = f"{post_in.poll.question}\n\n---\n\n{post_in.poll.description}"

        p_res = sb.table("polls").insert({
            "post_id": created_post["id"],
            "question": poll_q,
            "created_by": admin_user["id"]
        }).select().execute()

        if p_res.data:
            poll_id = p_res.data[0]["id"]
            opt_inserts = [{"poll_id": poll_id, "text": opt} for opt in post_in.poll.options]
            sb.table("poll_options").insert(opt_inserts).execute()

            poll_with_data = sb.table("polls").select("*, poll_options(*), poll_votes(*)").eq("id", poll_id).single().execute()
            created_poll = poll_with_data.data

    return format_post_from_supabase(created_post, created_poll, admin_user["id"])


@app.get("/api/posts/{post_id}", response_model=schemas.PostResponse)
def get_post(
    post_id: str,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    sb = get_supabase()
    post_res = sb.table("posts").select("*, author:profiles(*)").eq("id", post_id).single().execute()
    if not post_res.data:
        raise HTTPException(status_code=404, detail="Post not found")

    poll_res = sb.table("polls").select("*, poll_options(*), poll_votes(*)").eq("post_id", post_id).execute()
    poll_obj = poll_res.data[0] if poll_res.data else None

    user_id = current_user["id"] if current_user else None
    return format_post_from_supabase(post_res.data, poll_obj, user_id)


@app.patch("/api/posts/{post_id}/toggle-featured", response_model=schemas.PostResponse)
def toggle_featured_post(
    post_id: str,
    admin_user: dict = Depends(require_admin)
):
    sb = get_supabase()
    post_res = sb.table("posts").select("*, author:profiles(*)").eq("id", post_id).single().execute()
    if not post_res.data:
        raise HTTPException(status_code=404, detail="Post not found")

    post = post_res.data
    raw_media = post.get("media_urls")
    urls = []
    current_featured = False

    if isinstance(raw_media, dict):
        urls = raw_media.get("urls", [])
        current_featured = raw_media.get("is_featured", False)
    elif isinstance(raw_media, list):
        urls = raw_media

    new_featured = not current_featured
    updated_media = {"urls": urls, "is_featured": new_featured}

    up_res = sb.table("posts").update({"media_urls": updated_media}).eq("id", post_id).select("*, author:profiles(*)").execute()
    poll_res = sb.table("polls").select("*, poll_options(*), poll_votes(*)").eq("post_id", post_id).execute()
    poll_obj = poll_res.data[0] if poll_res.data else None

    return format_post_from_supabase(up_res.data[0], poll_obj, admin_user["id"])


@app.delete("/api/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: str,
    admin_user: dict = Depends(require_admin)
):
    sb = get_supabase()
    sb.table("posts").delete().eq("id", post_id).execute()
    return None


# --- POLLS ENDPOINTS (POWERED BY SUPABASE) ---

@app.get("/api/polls", response_model=List[schemas.PollResponse])
def get_polls(current_user: Optional[dict] = Depends(get_optional_current_user)):
    sb = get_supabase()
    res = sb.table("polls").select("*, poll_options(*), poll_votes(*)").order("created_at", desc=True).execute()
    user_id = current_user["id"] if current_user else None
    return [format_poll_from_supabase(p, user_id) for p in res.data]


@app.post("/api/polls", response_model=schemas.PollResponse, status_code=status.HTTP_201_CREATED)
def create_poll(
    poll_in: schemas.PollCreate,
    admin_user: dict = Depends(require_admin)
):
    sb = get_supabase()
    poll_q = poll_in.question
    if poll_in.description:
        poll_q = f"{poll_in.question}\n\n---\n\n{poll_in.description}"

    p_res = sb.table("polls").insert({
        "question": poll_q,
        "created_by": admin_user["id"]
    }).select().execute()

    if not p_res.data:
        raise HTTPException(status_code=500, detail="Failed to create poll")

    poll_id = p_res.data[0]["id"]
    opt_inserts = [{"poll_id": poll_id, "text": opt} for opt in poll_in.options]
    sb.table("poll_options").insert(opt_inserts).execute()

    poll_with_data = sb.table("polls").select("*, poll_options(*), poll_votes(*)").eq("id", poll_id).single().execute()
    return format_poll_from_supabase(poll_with_data.data, admin_user["id"])


@app.post("/api/polls/{poll_id}/vote", response_model=schemas.PollResponse)
def vote_poll(
    poll_id: str,
    vote_in: schemas.VoteRequest,
    current_user: dict = Depends(get_current_user)
):
    sb = get_supabase()
    user_id = current_user["id"]

    # Check if user has already voted on this poll
    existing = sb.table("poll_votes").select("id").eq("poll_id", poll_id).eq("user_id", user_id).execute()

    if existing.data and len(existing.data) > 0:
        # Update existing vote
        vote_id = existing.data[0]["id"]
        sb.table("poll_votes").update({"option_id": vote_in.option_id}).eq("id", vote_id).execute()
    else:
        # Insert new vote
        sb.table("poll_votes").insert({
            "poll_id": poll_id,
            "option_id": vote_in.option_id,
            "user_id": user_id
        }).execute()

    # Return refreshed poll
    poll_with_data = sb.table("polls").select("*, poll_options(*), poll_votes(*)").eq("id", poll_id).single().execute()
    return format_poll_from_supabase(poll_with_data.data, user_id)


@app.delete("/api/polls/{poll_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_poll(
    poll_id: str,
    admin_user: dict = Depends(require_admin)
):
    sb = get_supabase()
    sb.table("polls").delete().eq("id", poll_id).execute()
    return None


# --- MEDIA UPLOAD (ADMIN ONLY) ---

@app.post("/api/media/upload")
async def upload_media(
    request: Request,
    admin_user: dict = Depends(require_admin)
):
    content_type = request.headers.get("content-type", "")
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".webm"}

    # 1. Handle multipart form-data
    if "multipart/form-data" in content_type:
        try:
            form = await request.form()
            file = form.get("file")
            if file and hasattr(file, "filename") and file.filename:
                ext = os.path.splitext(file.filename)[1].lower()
                if ext not in allowed_extensions:
                    raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

                filename = f"{uuid.uuid4()}{ext}"
                file_path = os.path.join(UPLOAD_DIR, filename)

                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)

                media_type = "video" if ext in {".mp4", ".mov", ".webm"} else "image"
                return {"url": f"/uploads/{filename}", "filename": filename, "media_type": media_type}
        except RuntimeError:
            pass

    # 2. Handle base64 JSON payload
    try:
        data = await request.json()
        filename_orig = data.get("filename", "upload.jpg")
        content_b64 = data.get("content_base64", "")
        ext = os.path.splitext(filename_orig)[1].lower() or ".jpg"
        if ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

        if "," in content_b64:
            content_b64 = content_b64.split(",")[1]

        filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(base64.b64decode(content_b64))

        media_type = "video" if ext in {".mp4", ".mov", ".webm"} else "image"
        return {"url": f"/uploads/{filename}", "filename": filename, "media_type": media_type}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid upload request: {str(e)}")


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "Supabase (Cloud PostgreSQL)",
        "tables": ["public.profiles", "public.posts", "public.polls", "public.poll_options", "public.poll_votes"],
        "sole_admin": "Kalaga Pavan Kishore (pavan@kalagawealth.com)"
    }
