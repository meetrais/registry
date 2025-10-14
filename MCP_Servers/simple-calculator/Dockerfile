FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir fastmcp uvicorn

# Copy server file
COPY server.py .

# Expose port
EXPOSE 8080

# Run the server
CMD ["python", "server.py"]
