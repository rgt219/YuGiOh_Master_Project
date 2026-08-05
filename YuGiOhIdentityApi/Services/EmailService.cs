using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;
using YuGiOhIdentityApi.Repositories;

namespace YuGiOhIdentityApi.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_config["Smtp:FromName"], _config["Smtp:FromEmail"]));
        message.To.Add(new MailboxAddress("", toEmail));
        message.Subject = "🔑 RESET YOUR ACCESS CODE | ErreGeTe YGO";

        var resetLink = $"https://erregeteygo.com/reset-password?token={Uri.EscapeDataString(resetToken)}&email={Uri.EscapeDataString(toEmail)}";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"
                <div style='background-color: #0f172a; color: #ffffff; padding: 24px; font-family: monospace; border: 1px solid #00f2ff; border-radius: 8px;'>
                    <h2 style='color: #00f2ff;'>ERREGETE YGO SECURITY TERMINAL</h2>
                    <p>A password reset request was initiated for your duelist account.</p>
                    <p>Click the button below to establish a new access code (Link expires in 15 minutes):</p>
                    <p style='margin-top: 20px;'>
                        <a href='{resetLink}' style='background-color: #00f2ff; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;'>RESET PASSWORD</a>
                    </p>
                    <p style='color: #94a3b8; font-size: 11px; margin-top: 24px;'>If you did not request this, please ignore this uplink message.</p>
                </div>"
        };

        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(_config["Smtp:Host"], int.Parse(_config["Smtp:Port"]), SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_config["Smtp:Username"], _config["Smtp:Password"]);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}