import httpx

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=== STARTING FORGOT PASSWORD & SUPABASE EMAIL OTP TEST SUITE ===")
    client = httpx.Client(base_url=BASE_URL, timeout=15.0)

    test_email = "client@kalagawealth.com"

    # 1. Non-existent email should return 404
    bad_res = client.post("/api/auth/forgot-password/send-otp", json={
        "email": "nonexistent_random_user_999@test.com"
    })
    assert bad_res.status_code == 404, f"Expected 404, got {bad_res.status_code}: {bad_res.text}"
    print("✓ Step 1: Non-existent email correctly rejected with 404 Not Found")

    # 2. Valid email requests OTP
    send_res = client.post("/api/auth/forgot-password/send-otp", json={
        "email": test_email
    })
    assert send_res.status_code == 200, f"Send OTP failed: {send_res.status_code}: {send_res.text}"
    send_data = send_res.json()
    assert send_data["status"] == "success"
    otp_code = send_data.get("dev_otp_hint")
    assert otp_code is not None, "Expected OTP code in response"
    print(f"✓ Step 2: OTP successfully generated & sent via Supabase for {test_email}. OTP: {otp_code}")

    # 3. Invalid OTP code rejected
    bad_otp_res = client.post("/api/auth/forgot-password/verify-otp", json={
        "email": test_email,
        "otp": "000000"
    })
    assert bad_otp_res.status_code == 400, f"Expected 400, got {bad_otp_res.status_code}: {bad_otp_res.text}"
    print(f"✓ Step 3: Invalid OTP rejected with 400: {bad_otp_res.json().get('detail')}")

    # 4. Valid OTP verification
    verify_res = client.post("/api/auth/forgot-password/verify-otp", json={
        "email": test_email,
        "otp": str(otp_code)
    })
    assert verify_res.status_code == 200, f"Verify OTP failed: {verify_res.status_code}: {verify_res.text}"
    verify_data = verify_res.json()
    recovery_token = verify_data.get("recovery_token")
    print(f"✓ Step 4: OTP verified successfully by Supabase Auth. Recovery token present: {bool(recovery_token)}")

    # 5. Weak password rejected (< 6 chars)
    short_pw_res = client.post("/api/auth/forgot-password/reset-password", json={
        "email": test_email,
        "new_password": "123",
        "recovery_token": recovery_token
    })
    assert short_pw_res.status_code == 400, f"Expected 400 for short password, got {short_pw_res.status_code}"
    print("✓ Step 5: Password < 6 characters rejected with 400")

    # 6. Reset password with new valid password
    temp_new_password = "ClientNewPassword2026!"
    reset_res = client.post("/api/auth/forgot-password/reset-password", json={
        "email": test_email,
        "new_password": temp_new_password,
        "recovery_token": recovery_token,
        "otp": str(otp_code)
    })
    assert reset_res.status_code == 200, f"Reset password failed: {reset_res.status_code}: {reset_res.text}"
    print(f"✓ Step 6: Password reset successfully via Supabase Auth: {reset_res.json().get('message')}")

    # 7. Old password fails
    old_login_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "client123"
    })
    assert old_login_res.status_code == 401, "Old password should fail after reset"
    print("✓ Step 7: Old password correctly rejected (401 Unauthorized)")

    # 8. New password succeeds
    new_login_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": temp_new_password
    })
    assert new_login_res.status_code == 200, f"New password login failed: {new_login_res.text}"
    print("✓ Step 8: Login with new password succeeded! User authenticated.")

    # 9. Restore standard test password (client123)
    # Generate new OTP to restore
    send_restore = client.post("/api/auth/forgot-password/send-otp", json={"email": test_email})
    restore_otp = send_restore.json().get("dev_otp_hint")
    restore_res = client.post("/api/auth/forgot-password/reset-password", json={
        "email": test_email,
        "new_password": "client123",
        "otp": str(restore_otp)
    })
    assert restore_res.status_code == 200, f"Restore failed: {restore_res.text}"
    
    # Verify standard password works again
    recheck_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "client123"
    })
    assert recheck_res.status_code == 200, "Standard password should work again"
    print("✓ Step 9: Standard password 'client123' restored and verified.")

    print("\nALL 9 FORGOT PASSWORD & OTP TESTS PASSED FLAWLESSLY!")

if __name__ == "__main__":
    run_tests()
