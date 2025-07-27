# Puenkaset POS Application Patcher System: User Guide

This guide provides simple instructions for end-users on how the Puenkaset POS application update system works, what to expect during updates, and how to troubleshoot common issues.

## 1. How Updates Work

The Puenkaset POS application is designed to keep itself up-to-date automatically, ensuring you always have the latest features and bug fixes.

*   **Automatic Checks:** The application automatically checks for new updates when it starts and periodically while it's running (every 24 hours by default).
*   **Update Notifications:** When a new update is available, a notification will appear on your screen, informing you about the new version and its key changes. You will have the option to install the update immediately or postpone it.

## 2. What to Expect During Updates

When you choose to update, or if automatic updates are enabled, here's what will happen:

*   **Download Progress:** A progress window will appear, showing the download status of the update files. You'll see the percentage completed, download speed, and estimated time remaining.
*   **Installation Progress:** After downloading, the application will begin installing the update. This process might involve backing up your database, updating the database schema, and replacing application files. The progress window will show the current installation phase.
*   **Application Restart:** Once the installation is complete, the application will automatically restart to apply the new version. This is a normal part of the update process.
*   **Brief Downtime:** There will be a brief period of downtime during the installation and restart. Please do not close the application or shut down your computer during this time.

## 3. Troubleshooting Common Issues

If you encounter any problems during the update process, here are some common issues and their solutions:

*   **"Update Failed" Message:**
    *   **Cause:** This can happen due to various reasons like internet connection issues, insufficient disk space, or corrupted download files.
    *   **Solution:**
        1.  **Check Internet Connection:** Ensure your computer is connected to a stable internet connection.
        2.  **Free Up Disk Space:** Make sure you have enough free space on your hard drive.
        3.  **Retry Update:** Close the application and try opening it again. The update system might re-attempt the download or installation.
        4.  **Temporarily Disable Antivirus:** In rare cases, antivirus software might interfere. Try temporarily disabling it and retrying the update (remember to re-enable it afterward).
*   **No Update Notification Appears:**
    *   **Cause:** Automatic checks might be disabled, or there might be a temporary network issue preventing the check.
    *   **Solution:**
        1.  **Manually Check for Updates:** Go to `Settings` > `Application Update` and click the "ตรวจสอบอัปเดต" (Check for Updates) button.
        2.  **Check Internet Connection:** Ensure your computer is connected to the internet.
*   **Application Not Starting After Update:**
    *   **Cause:** This is rare but can happen if the update process was interrupted or corrupted.
    *   **Solution:**
        1.  **Restart Your Computer:** A simple restart can often resolve this.
        2.  **Reinstall Application:** If restarting doesn't work, you might need to download the latest installer from the official source and reinstall the application. Your data should remain intact as the database is separate.

## 4. How to Configure Update Settings in the Application

You can customize how the application handles updates through the settings menu:

1.  Open the Puenkaset POS application.
2.  Navigate to the `Settings` (การตั้งค่า) section.
3.  Look for the `Application Update` (การอัปเดตแอปพลิเคชัน) section.

Here you will find the following options:

*   **ตรวจสอบอัปเดตอัตโนมัติ (Auto Check for Updates):**
    *   If checked, the application will automatically look for new updates.
    *   **Recommendation:** Keep this enabled for automatic security and feature updates.
*   **ดาวน์โหลดอัปเดตอัตโนมัติ (Auto Download Updates):**
    *   If checked, the application will automatically download updates in the background once available.
    *   **Recommendation:** Enable this for convenience, but ensure you have a stable internet connection.
*   **ติดตั้งอัปเดตอัตโนมัติ (Auto Install Updates):**
    *   If checked, the application will automatically install downloaded updates. This will cause the application to restart.
    *   **Recommendation:** Use with caution. For a family business, you might prefer to install manually at a convenient time to avoid unexpected restarts during business hours.
*   **รับอัปเดตเวอร์ชันทดสอบ (Pre-release) (Allow Pre-release Updates):**
    *   If checked, the application will also consider and install pre-release versions (beta, alpha versions). These versions might contain new features but could also be less stable.
    *   **Recommendation:** Keep this unchecked unless you are specifically testing new features and are aware of potential instability.

Remember to click any "Save" or "Apply" button if available after changing settings (though changes are often applied immediately).

## 5. What to Do if Updates Fail

If an update fails and the troubleshooting steps above don't resolve the issue, please follow these steps to provide information to technical support:

1.  **Note the Error Message:** Write down or take a screenshot of any error messages displayed in the update progress window or in the application.
2.  **Check Application Logs:**
    *   The application generates logs that can help diagnose issues.
    *   **Location:** (Provide specific path, e.g., `C:\Users\YourUser\AppData\Roaming\PuenkasetPOS\logs\update.log` - *This path needs to be confirmed by a developer.*)
    *   Provide the `update.log` file to technical support.
3.  **Contact Technical Support:**
    *   Provide all collected error messages and log files.
    *   Describe the steps you took leading to the failure.
    *   Mention your current application version.

Your cooperation helps us resolve issues quickly and improve the update system.