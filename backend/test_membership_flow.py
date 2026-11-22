import sys
import httpx

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=== STARTING MEMBERSHIP, FREE/PAID MODES & DYNAMIC PRICING VERIFICATION ===")
    client = httpx.Client(base_url=BASE_URL, timeout=30.0)

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

    # 2. Public / Client fetches membership settings
    settings_res = client.get("/api/membership/settings")
    assert settings_res.status_code == 200, f"Get settings failed: {settings_res.text}"
    settings = settings_res.json()
    print(f"✓ Step 2: Retrieved membership settings: mode={settings.get('membership_mode')}, fee=₹{settings.get('membership_fee')}")

    # 3. Client Login
    client_login_res = client.post("/api/auth/login", json={
        "email": "client@kalagawealth.com",
        "password": "client123"
    })
    assert client_login_res.status_code == 200, f"Client login failed: {client_login_res.text}"
    client_data = client_login_res.json()
    client_token = client_data["access_token"]
    client_id = client_data["user"]["id"]
    print(f"✓ Step 3: Client logged in. ID: {client_id}")

    # Reset client to unpaid initially via Admin API
    reset_res = client.post(
        f"/api/admin/clients/{client_id}/membership",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"action": "reject"}
    )
    assert reset_res.status_code == 200, f"Reset client failed: {reset_res.text}"
    print("✓ Step 4: Client status reset to 'unpaid'")

    # 5. Set Admin Membership Settings to Paid Mode with Custom Fee: ₹299
    update_settings_res = client.patch(
        "/api/admin/membership/settings",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"membership_mode": "paid", "membership_fee": 299}
    )
    assert update_settings_res.status_code == 200, f"Update settings failed: {update_settings_res.text}"
    updated_settings = update_settings_res.json()
    assert updated_settings["membership_mode"] == "paid"
    assert updated_settings["membership_fee"] == 299
    print(f"✓ Step 5: Admin set membership to Paid mode with custom price: ₹{updated_settings['membership_fee']}")

    # 6. Verify Unpaid Client is BLOCKED from Feed with 402 mentioning dynamic ₹299
    feed_res = client.get(
        "/api/posts",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert feed_res.status_code == 402, f"Expected 402 for unpaid client, got {feed_res.status_code}: {feed_res.text}"
    detail_msg = feed_res.json().get('detail', '')
    assert "₹299" in detail_msg, f"Expected dynamic fee ₹299 in detail message, got: {detail_msg}"
    print(f"✓ Step 6: Unpaid client blocked with dynamic 402: '{detail_msg}'")

    # 7. Client submits payment with dynamic fee ₹299
    test_utr = "987654321098"
    submit_res = client.post(
        "/api/membership/submit-payment",
        headers={"Authorization": f"Bearer {client_token}"},
        json={"utr_number": test_utr, "amount": 299, "upi_id": "9704875593@slc"}
    )
    assert submit_res.status_code == 200, f"Submit payment failed: {submit_res.text}"
    updated_client = submit_res.json()["user"]
    assert updated_client["membership_status"] == "pending"
    assert updated_client["last_payment_utr"] == test_utr
    print(f"✓ Step 7: Client submitted payment with UTR {test_utr} for ₹299. Status: pending")

    # 8. Admin approves membership for 30 days
    approve_res = client.post(
        f"/api/admin/clients/{client_id}/membership",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"action": "approve", "days": 30}
    )
    assert approve_res.status_code == 200, f"Approve failed: {approve_res.text}"
    approved_client = approve_res.json()["client"]
    assert approved_client["membership_status"] == "active"
    assert approved_client["days_remaining"] is not None and approved_client["days_remaining"] >= 29
    print(f"✓ Step 8: Admin approved client for 30 days. Days remaining: {approved_client['days_remaining']}")

    # 9. Client accesses single scroll research feed (NOW UNLOCKED)
    feed_unlocked_res = client.get(
        "/api/posts",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert feed_unlocked_res.status_code == 200, f"Feed should be unlocked, got {feed_unlocked_res.status_code}"
    print(f"✓ Step 9: Single scroll research feed UNLOCKED in Paid mode! Returned {len(feed_unlocked_res.json())} posts")

    # 10. Admin revokes client membership back to 'unpaid'
    reject_res = client.post(
        f"/api/admin/clients/{client_id}/membership",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"action": "reject"}
    )
    assert reject_res.status_code == 200, f"Reject failed: {reject_res.text}"
    print("✓ Step 10: Client membership revoked back to 'unpaid'")

    # 11. SWITCH TO FREE ACCESS MODE
    free_mode_res = client.patch(
        "/api/admin/membership/settings",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"membership_mode": "free"}
    )
    assert free_mode_res.status_code == 200, f"Switch to free mode failed: {free_mode_res.text}"
    assert free_mode_res.json()["membership_mode"] == "free"
    print("✓ Step 11: Admin switched platform to 'free' Access Mode")

    # 12. Unpaid client accesses feed in Free mode -> 200 OK (UNRESTRICTED ACCESS!)
    feed_free_res = client.get(
        "/api/posts",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert feed_free_res.status_code == 200, f"Unpaid client should have free access, got {feed_free_res.status_code}: {feed_free_res.text}"
    print(f"✓ Step 12: In Free Access Mode, unpaid client successfully accesses feed without payment! ({len(feed_free_res.json())} posts)")

    # 13. Client tries to submit payment in Free Mode -> 400 Bad Request
    sub_free_res = client.post(
        "/api/membership/submit-payment",
        headers={"Authorization": f"Bearer {client_token}"},
        json={"utr_number": "123456789012", "amount": 149}
    )
    assert sub_free_res.status_code == 400, f"Submitting payment in free mode should return 400, got {sub_free_res.status_code}"
    print(f"✓ Step 13: Payment submission rejected in Free mode with 400: '{sub_free_res.json().get('detail')}'")

    # 14. Switch back to Paid Mode with ₹149 default fee
    paid_restore_res = client.patch(
        "/api/admin/membership/settings",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"membership_mode": "paid", "membership_fee": 149}
    )
    assert paid_restore_res.status_code == 200
    print("✓ Step 14: Restored Paid Mode with default ₹149 fee")

    # 15. Verify unpaid client is now gated again
    feed_gated_again = client.get(
        "/api/posts",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert feed_gated_again.status_code == 402
    assert "₹149" in feed_gated_again.json().get("detail", "")
    print(f"✓ Step 15: In Paid Mode, unpaid client is gated again with 402: '{feed_gated_again.json().get('detail')}'")

    # 16. Restore client to active for ongoing usage
    restore_res = client.post(
        f"/api/admin/clients/{client_id}/membership",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"action": "approve", "days": 30}
    )
    assert restore_res.status_code == 200
    print("✓ Step 16: Restored client to active 30 days for ongoing development/demo.")
    print("\nALL 16 TESTS PASSED! Free Mode vs Paid Mode, dynamic pricing, and gating verified flawlessly.")

if __name__ == "__main__":
    run_tests()
