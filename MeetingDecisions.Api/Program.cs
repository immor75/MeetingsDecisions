using MeetingDecisions.Api;
using MeetingDecisions.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.OperationFilter<SwaggerFileOperationFilter>();
});

// CORS για Angular
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy => policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyMethod()
            .AllowAnyHeader());
});

// Register Document Service
builder.Services.AddScoped<IDocumentService, DocumentService>();

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