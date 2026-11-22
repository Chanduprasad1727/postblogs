import httpx

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=== STARTING PASSWORD RESET LINK TEST SUITE (ZERO OTP DISPLAY) ===")
    client = httpx.Client(base_url=BASE_URL, timeout=15.0)

    test_email = "client@kalagawealth.com"

    # 1. Non-existent email should return 404
    bad_res = client.post("/api/auth/forgot-password", json={
        "email": "nonexistent_random_user_999@test.com"
    })
    assert bad_res.status_code == 404, f"Expected 404, got {bad_res.status_code}: {bad_res.text}"
    print("✓ Step 1: Non-existent email correctly rejected with 404 Not Found")

    # 2. Valid email requests password reset link
    send_res = client.post("/api/auth/forgot-password", json={
        "email": test_email,
        "redirect_to": "http://localhost:5173/"
    })
    assert send_res.status_code == 200, f"Send reset link failed: {send_res.status_code}: {send_res.text}"
    send_data = send_res.json()
    assert send_data["status"] == "success"
    
    # STRICT SECURITY CHECK: No OTP or code should EVER be in response payload
    assert "dev_otp_hint" not in send_data, "SECURITY BUG: dev_otp_hint found in response payload!"
    assert "otp" not in send_data, "SECURITY BUG: otp found in response payload!"
    assert "code" not in send_data, "SECURITY BUG: code found in response payload!"
    print(f"✓ Step 2: Password reset link dispatched via Supabase for {test_email}. Clean message: '{send_data.get('message')}'. ZERO OTP exposed.")

    # 3. Password reset requires minimum 6 characters
    weak_res = client.post("/api/auth/reset-password", json={
        "email": test_email,
        "new_password": "123"
    })
    assert weak_res.status_code == 400, f"Expected 400 for short password, got {weak_res.status_code}"
    print("✓ Step 3: Weak password (< 6 chars) rejected with 400 Bad Request")

    # 4. Valid password reset
    temp_new_password = "ClientNewPassword2026!"
    reset_res = client.post("/api/auth/reset-password", json={
        "email": test_email,
        "new_password": temp_new_password
    })
    assert reset_res.status_code == 200, f"Reset password failed: {reset_res.status_code}: {reset_res.text}"
    print(f"✓ Step 4: Password successfully updated via Supabase Auth: {reset_res.json().get('message')}")

    # 5. Old password rejected
    old_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "client123"
    })
    assert old_login.status_code == 401, "Old password should fail after update"
    print("✓ Step 5: Old password correctly rejected (401 Unauthorized)")

    # 6. New password login succeeds
    new_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": temp_new_password
    })
    assert new_login.status_code == 200, f"New password login failed: {new_login.text}"
    print("✓ Step 6: Login with new password succeeded! User session established.")

    # 7. Restore standard password (client123)
    restore_res = client.post("/api/auth/reset-password", json={
        "email": test_email,
        "new_password": "client123"
    })
    assert restore_res.status_code == 200, f"Restore failed: {restore_res.text}"
    recheck_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "client123"
    })
    assert recheck_res.status_code == 200, "Standard password should work again"
    print("✓ Step 7: Standard password 'client123' restored and verified.")

    print("\nALL 7 PASSWORD RESET LINK TESTS PASSED! Zero OTP displayed or leaked.")

if __name__ == "__main__":
    run_tests()
