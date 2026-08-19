using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using YuGiOhIdentityApi.Services;
using YuGiOhIdentityApi.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using YuGiOhIdentityApi.Repositories; // Add this

namespace YuGiOhIdentityApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserRegistrationService _userService;
    private readonly IConfiguration _config; // FIX: Added configuration field

    // FIX: Inject IConfiguration here
    public UsersController(UserRegistrationService userService, IConfiguration config)
    {
        _userService = userService;
        _config = config;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] UserRegistration user)
    {
        if (user == null || string.IsNullOrEmpty(user.Email))
            return BadRequest(new { message = "INVALID_TERMINAL_DATA" });

        var existingUser = await _userService.GetByEmailAsync(user.Email);
        if (existingUser != null)
            return BadRequest(new { message = "IDENTIFIER_ALREADY_EXISTS" });

        await _userService.CreateAsync(user);
        return Ok(new { message = "DATABASE_UPLINK_SUCCESSFUL" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] UserRegistration user)
    {
        if (string.IsNullOrWhiteSpace(user.Email))
        {
            return BadRequest("Email cannot be null or empty.");
        }

        var registeredUser = await _userService.GetByEmailAsync(user.Email);

        if (registeredUser == null)
        {
            return Unauthorized(new { message = "INVALID_ACCESS_CODE" });
        }

        bool isValid = BCrypt.Net.BCrypt.Verify(user.Password, registeredUser.Password);

        if (!isValid)
        {
            return Unauthorized(new { message = "INVALID_ACCESS_CODE" });
        }

        var token = GenerateJwtToken(registeredUser);

        return Ok(new
        {
            firstName = registeredUser.FirstName,
            lastName = registeredUser.LastName,
            email = registeredUser.Email,
            userName = registeredUser.UserName,
            id = registeredUser.Id,
            token
        });
    }

    private string GenerateJwtToken(UserRegistration user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[] {
            new Claim(JwtRegisteredClaimNames.Sub, user.UserName ?? ""),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new Claim("userId", user.Id.ToString() ?? ""),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            new Claim(ClaimTypes.Name, user.UserName ?? "")
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddMinutes(120),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public record ForgotPasswordRequest(string Email);
    public record ResetPasswordRequest(string Email, string Token, string NewPassword);

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, [FromServices] IEmailService emailService)
    {
        if (string.IsNullOrEmpty(request.Email))
            return BadRequest(new { message = "Invalid Email" });

        var user = await _userService.GetByEmailAsync(request.Email);

        if (user == null)
            return Ok(new { message = "DISPATCH_COMMAND_SENT" });

        if (string.IsNullOrWhiteSpace(user.Email))
        {
            // Handle the error: return an error response, throw, or abort the process
            return BadRequest("Cannot send password reset: User email is missing.");
        }

        var token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
        user.ResetToken = token;
        user.ResetTokenExpires = DateTime.UtcNow.AddMinutes(15);

        await _userService.UpdateAsync(user);

        try
        {
            await emailService.SendPasswordResetEmailAsync(user.Email, token);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Email uplink failed", details = ex.Message });
        }

        return Ok(new { message = "DISPATCH_COMMAND_SENT" });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.NewPassword))
            return BadRequest(new { message = "INVALID_TERMINAL_PAYLOAD" });

        var user = await _userService.GetByEmailAsync(request.Email);

        if (user == null || user.ResetToken != request.Token || user.ResetTokenExpires == null || user.ResetTokenExpires < DateTime.UtcNow)
        {
            return BadRequest(new { message = "EXPIRED_OR_INVALID_SECURITY_TOKEN" });
        }

        // Update credentials and invalidate token
        user.Password = request.NewPassword;
        user.ResetToken = null;
        user.ResetTokenExpires = null;

        await _userService.UpdateAsync(user);

        return Ok(new { message = "CREDENTIALS_SUCCESSFULLY_UPDATED" });
    }
}