using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using YuGiOhIdentityApi.Services;
using YuGiOhIdentityApi.Models;

namespace YuGiOhIdentityApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserRegistrationService _userService;

    public UsersController(UserRegistrationService userService)
    {
        _userService = userService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] UserRegistration user)
    {
        // 1. Validate the request
        if (user == null || string.IsNullOrEmpty(user.Email))
            return BadRequest(new { message = "INVALID_TERMINAL_DATA" });

        // 2. Check if the user already exists
        var existingUser = await _userService.GetByEmailAsync(user.Email);
        if (existingUser != null)
            return BadRequest(new { message = "IDENTIFIER_ALREADY_EXISTS" });

        // 3. Save to MongoDB
        await _userService.CreateAsync(user);

        return Ok(new { message = "DATABASE_UPLINK_SUCCESSFUL" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] UserRegistration user)
    {
        var registeredUser = await _userService.GetByEmailAsync(user.Email);

        // In a real scenario, use: BCrypt.Net.BCrypt.Verify(user.Password, registeredUser.Password)
        if (registeredUser == null || registeredUser.Password != user.Password)
        {
            return Unauthorized(new { message = "INVALID_ACCESS_CODE" });
        }

        // This is the "Identity Profile" that the Frontend will store
        return Ok(new
        {
            firstName = registeredUser.FirstName,
            lastName = registeredUser.LastName,
            email = registeredUser.Email,
            userName = registeredUser.UserName,
            id = registeredUser.Id,
            token = "GENERATED_JWT_GOES_HERE" // Later, we can add JWT tokens here
        });
    }
}
