using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Threading.Tasks;
using MongoDB.Driver;
using MongoDB.Bson;
using YuGiOhIdentityApi.Models;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http.HttpResults;
using BCrypt.Net;

namespace YuGiOhIdentityApi.Services
{
    public class UserRegistrationService
    {
        private readonly IMongoCollection<UserRegistration> _users;

        public UserRegistrationService(IOptions<MongoDBUserSettings> mongoDBSettings)
        {
            MongoClient client = new MongoClient(mongoDBSettings.Value.ConnectionURI);
            IMongoDatabase database = client.GetDatabase(mongoDBSettings.Value.DatabaseName);
            _users = database.GetCollection<UserRegistration>(mongoDBSettings.Value.CollectionName);
        }

        public async Task<UserRegistration?> GetByEmailAsync(string email) =>
            await _users.Find(u => u.Email == email).FirstOrDefaultAsync();

        public async Task CreateAsync(UserRegistration newUser)
        {
            var existingUser = await GetByEmailAsync(newUser.Email);
            if (existingUser != null)
            {
                throw new Exception("User already exists.");
            }

            // --- BCRYPT HASHING ---
            if (!string.IsNullOrEmpty(newUser.Password))
            {
                newUser.Password = BCrypt.Net.BCrypt.HashPassword(newUser.Password);
            }

            await _users.InsertOneAsync(newUser);
        }
    }
}
