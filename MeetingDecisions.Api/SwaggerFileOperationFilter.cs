using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace MeetingDecisions.Api;

public class SwaggerFileOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // Only apply to file upload endpoints
        var formFileParams = context.ApiDescription.ParameterDescriptions
            .Where(p => p.ModelMetadata != null && 
                       p.ModelMetadata.ContainerType != null &&
                       p.ModelMetadata.ContainerType.GetProperties()
                           .Any(prop => prop.PropertyType == typeof(IFormFile)))
            .ToList();

        if (!formFileParams.Any())
            return;

        operation.RequestBody = new OpenApiRequestBody
        {
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["multipart/form-data"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema
                    {
                        Type = "object",
                        Properties = new Dictionary<string, OpenApiSchema>
                        {
                            ["File"] = new OpenApiSchema
                            {
                                Type = "string",
                                Format = "binary",
                                Description = "Upload .docx file"
                            },
                            ["TemplateId"] = new OpenApiSchema
                            {
                                Type = "string",
                                Default = new Microsoft.OpenApi.Any.OpenApiString("default"),
                                Description = "Template ID"
                            }
                        },
                        Required = new HashSet<string> { "File" }
                    }
                }
            }
        };
    }
}