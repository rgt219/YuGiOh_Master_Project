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

        var fromName = _config["Smtp:FromName"];
        var fromEmail = _config["Smtp:FromEmail"]
            ?? throw new InvalidOperationException("SMTP 'FromEmail' configuration is missing.");

        message.From.Add(new MailboxAddress(fromName, fromEmail));
        message.To.Add(new MailboxAddress("", toEmail));
        message.Subject = "Reset password | ErreGeTe YGO";

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

        var host = _config["Smtp:Host"]
            ?? throw new InvalidOperationException("SMTP Host is missing.");

        var portStr = _config["Smtp:Port"]
            ?? throw new InvalidOperationException("SMTP Port is missing.");

        var username = _config["Smtp:Username"]
            ?? throw new InvalidOperationException("SMTP Username is missing.");

        var password = _config["Smtp:Password"]
            ?? throw new InvalidOperationException("SMTP Password is missing.");

        if (!int.TryParse(portStr, out int port))
        {
            throw new InvalidOperationException("SMTP Port is not a valid integer.");
        }

        await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(username, password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}