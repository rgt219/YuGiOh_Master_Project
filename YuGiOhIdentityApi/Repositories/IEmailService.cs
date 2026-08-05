namespace YuGiOhIdentityApi.Repositories;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string resetToken);
}