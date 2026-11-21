import sys
import httpx

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=== STARTING MEMBERSHIP & CONTENT GATING VERIFICATION ===")
    client = httpx.Client(base_url=BASE_URL, timeout=15.0)

    # 1. Admin Login
    admin_login_res = client.post("/api/auth/login", json={
        "email": "pavan@kalagawealth.com",
        "password": "admin123"
    })
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_data = admin_login_res.json()
    admin_token = admin_data["access_token"]
    admin_user = admin_data["user"]
    assert admin_user["role"] == "admin"
    assert admin_user["membership_status"] == "active"
    print(f"✓ Step 1: Sole Admin (Kalaga Pavan Kishore) logged in successfully. Status: {admin_user['membership_status']}")

    # 2. Client Login
    client_login_res = client.post("/api/auth/login", json={
        "email": "client@kalagawealth.com",
        "password": "client123"
    })
    assert client_login_res.status_code == 200, f"Client login failed: {client_login_res.text}"
    client_data = client_login_res.json()
    client_token = client_data["access_token"]
    client_id = client_data["user"]["id"]
    print(f"✓ Step 2: Client logged in. ID: {client_id}")

    # Reset client to unpaid initially via Admin API
    reset_res = client.post(
        f"/api/admin/clients/{client_id}/membership",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"action": "reject"}
    )
    assert reset_res.status_code == 200, f"Reset client failed: {reset_res.text}"
    print("✓ Step 3: Client status reset to 'unpaid'")

    # 4. Verify Unpaid Client is BLOCKED from Feed (402 Payment Required)
    feed_res = client.get(
        "/api/posts",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert feed_res.status_code == 402, f"Expected 402 for unpaid client, got {feed_res.status_code}: {feed_res.text}"
    print(f"✓ Step 4: Unpaid client blocked with 402 Payment Required: {feed_res.json().get('detail')}")

    # 5. Verify Unpaid Client can still view featured preview posts (Home page)
    featured_res = client.get("/api/posts?featured=true")
    assert featured_res.status_code == 200, f"Featured posts failed: {featured_res.status_code}"
    print(f"✓ Step 5: Featured preview posts accessible to all: {len(featured_res.json())} posts found")

    # 6. Client submits UPI payment UTR
    test_utr = "987654321098"
    submit_res = client.post(
        "/api/membership/submit-payment",
        headers={"Authorization": f"Bearer {client_token}"},
        json={"utr_number": test_utr, "amount": 149, "upi_id": "9704875593@slc"}
    )
    assert submit_res.status_code == 200, f"Submit payment failed: {submit_res.text}"
    updated_client = submit_res.json()["user"]
    assert updated_client["membership_status"] == "pending"
    assert updated_client["last_payment_utr"] == test_utr
    print(f"✓ Step 6: Client submitted payment with UTR {test_utr}. Status changed to 'pending'")

    # 7. Verify Pending Client is STILL BLOCKED from Feed until Admin approves
    feed_pending_res = client.get(
        "/api/posts",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert feed_pending_res.status_code == 402, f"Pending client should get 402, got {feed_pending_res.status_code}"
    print("✓ Step 7: Pending client blocked from feed pending Admin approval")

    # 8. Admin lists clients and verifies pending status & UTR
    clients_res = client.get(
        "/api/admin/clients",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert clients_res.status_code == 200, f"Admin list clients failed: {clients_res.text}"
    client_entry = next((c for c in clients_res.json() if c["id"] == client_id), None)
    assert client_entry is not None, "Client not found in admin client list"
    assert client_entry["membership_status"] == "pending"
    assert client_entry["last_payment_utr"] == test_utr
    print(f"✓ Step 8: Admin sees pending client in Manage Clients modal with UTR: {client_entry['last_payment_utr']}")

    # 9. Admin approves membership for 30 days
    approve_res = client.post(
        f"/api/admin/clients/{client_id}/membership",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"action": "approve", "days": 30}
    )
    assert approve_res.status_code == 200, f"Approve failed: {approve_res.text}"
    approved_client = approve_res.json()["client"]
    assert approved_client["membership_status"] == "active"
    assert approved_client["days_remaining"] is not None and approved_client["days_remaining"] >= 29
    print(f"✓ Step 9: Admin approved membership for 30 days. Client days remaining: {approved_client['days_remaining']}")

    # 10. Client checks profile (/api/auth/me) with existing token and sees 'active' and 'days_remaining'
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert me_res.status_code == 200, f"/api/auth/me failed: {me_res.text}"
    me_user = me_res.json()
    assert me_user["membership_status"] == "active", f"Expected active, got {me_user['membership_status']}"
    assert me_user["days_remaining"] is not None and me_user["days_remaining"] >= 29
    print(f"✓ Step 10: Client /api/auth/me reflects active status with {me_user['days_remaining']} days remaining countdown")

    # 11. Client accesses single scroll research feed (NOW UNLOCKED)
    feed_unlocked_res = client.get(
        "/api/posts",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert feed_unlocked_res.status_code == 200, f"Feed should be unlocked, got {feed_unlocked_res.status_code}"
    print(f"✓ Step 11: Single scroll research feed UNLOCKED! Returned {len(feed_unlocked_res.json())} posts")

    # 12. Admin extends membership by +30 days
    extend_res = client.post(
        f"/api/admin/clients/{client_id}/membership",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"action": "extend", "days": 30}
    )
    assert extend_res.status_code == 200, f"Extend failed: {extend_res.text}"
    extended_client = extend_res.json()["client"]
    assert extended_client["days_remaining"] >= 58
    print(f"✓ Step 12: Admin extended membership (+30 days). Total days remaining: {extended_client['days_remaining']}")

    # 13. Admin rejects / revokes membership
    reject_res = client.post(
        f"/api/admin/clients/{client_id}/membership",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"action": "reject"}
    )
    assert reject_res.status_code == 200, f"Reject failed: {reject_res.text}"
    rejected_client = reject_res.json()["client"]
    assert rejected_client["membership_status"] == "unpaid"
    print("✓ Step 13: Admin revoked client membership back to 'unpaid'")

    # 14. Client is immediately blocked again from feed without re-login
    feed_revoked_res = client.get(
        "/api/posts",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert feed_revoked_res.status_code == 402, f"Revoked client should get 402, got {feed_revoked_res.status_code}"
    print("✓ Step 14: Revoked client immediately blocked from feed with 402 Payment Required")

    # Restore client to active for normal usage
    requests_restore = client.post(
        f"/api/admin/clients/{client_id}/membership",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"action": "approve", "days": 30}
    )
    print("✓ Restored client to active 30 days for ongoing development/demo.")
    print("\nALL 14 TESTS PASSED! Membership, UPI QR gating, renewal countdown, and admin management verified flawlessly.")

if __name__ == "__main__":
    run_tests()
