using MeetingDecisions.Api;
using MeetingDecisions.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS για Angular και Collabora
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy => policy
            .WithOrigins(
                "http://localhost:4200", 
                "http://localhost:9980",
                "http://127.0.0.1:9980"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .WithExposedHeaders("X-WOPI-Lock", "X-WOPI-Override")
            .AllowCredentials());
});

// Register Document Service
builder.Services.AddScoped<IDocumentService, DocumentService>();

// Register WOPI Service as Singleton to initialize at startup
builder.Services.AddSingleton<IWopiService, WopiService>();

// Add logging for debugging
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.SetMinimumLevel(LogLevel.Debug);

// Configuration settings
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["DocumentSettings:TemplatesPath"] = "Documents/Templates",
    ["DocumentSettings:TempPath"] = "Documents/Temp"
});

var app = builder.Build();

// Ensure directories exist
Directory.CreateDirectory("Documents/Templates");
Directory.CreateDirectory("Documents/Temp");

// Test WopiService initialization
try
{
    using var scope = app.Services.CreateScope();
    var wopiService = scope.ServiceProvider.GetRequiredService<IWopiService>();
    app.Logger.LogInformation("✅ WopiService loaded successfully");
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "❌ Failed to load WopiService");
}

// Enable WebSockets
app.UseWebSockets();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngular");
// app.UseHttpsRedirection(); // Σχολίασε αυτή τη γραμμή για development
app.UseAuthorization();
app.MapControllers();

// Startup message
var urls = app.Urls;
app.Logger.LogInformation("===========================================");
app.Logger.LogInformation("Meeting Decisions API Started Successfully");
foreach (var url in urls)
{
    app.Logger.LogInformation($"Listening on: {url}");
}
app.Logger.LogInformation("Swagger UI: Check URLs above + /swagger");
app.Logger.LogInformation("===========================================");

app.Run();