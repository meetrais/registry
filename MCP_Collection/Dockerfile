FROM python:3.11-slim

WORKDIR /app

# Copy application files
COPY server.py .
COPY index.html .
COPY styles.css .
COPY app.js .

# Install dependencies (none needed for this simple server)
# If you add dependencies later, create requirements.txt and uncomment:
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 8080

# Run the server
CMD ["python", "server.py"]
