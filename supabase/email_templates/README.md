# Supabase Email Templates - Kalaga Wealth

## How to Set Up the Password Reset Email in Supabase:

1. Open your **Supabase Dashboard**: [https://supabase.com/dashboard/project/nqgtjapaarsrhumfprfc](https://supabase.com/dashboard/project/nqgtjapaarsrhumfprfc)
2. In the left navigation menu, click **Authentication** -> **Email Templates**.
3. Under Email Templates, select **Reset Password**.
4. Set the **Subject** line to:
   ```
   Reset Your Password - Kalaga Wealth
   ```
5. In the **Body** (HTML) editor:
   - Select all existing content and delete it.
   - Copy the entire content from `supabase/email_templates/reset_password.html`.
   - Paste it into the editor.
6. Click **Save Changes** at the bottom.

---

### Features of this Template:
- **Kalaga Wealth Visual Identity**: Custom dark luxury slate (`#020617` / `#0f172a`), emerald & amber gradients, KW brand monogram.
- **Single-Use Secure Link**: Uses official Supabase template tag `{{ .ConfirmationURL }}`.
- **Security Callout**: Highlights 1-hour expiration and safe ignore notice.
- **Cross-Client Tested**: Fully responsive and renders cleanly across Gmail, Apple Mail, Outlook, iOS, and Android.
