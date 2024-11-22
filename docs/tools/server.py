from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import json
import glob

class DiagramHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Change to the project root directory
        os.chdir(os.path.join(os.path.dirname(__file__), "../.."))
        super().__init__(*args, **kwargs)

    def do_GET(self):
        if self.path == '/list-mmd':
            self.handle_list_mmd()
        elif self.path.startswith('/read-mmd/'):
            self.handle_read_mmd()
        else:
            super().do_GET()

    def end_headers(self):
        self.send_cors_headers()
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')

    def handle_read_mmd(self):
        try:
            # Remove /read-mmd/ prefix and decode the path
            file_path = self.path[10:]  # len('/read-mmd/') == 10
            
            # Security check: ensure path is within docs/architecture
            if not file_path.startswith('docs/architecture/') or '..' in file_path:
                raise ValueError('Invalid file path')
                
            with open(file_path, 'r') as f:
                content = f.read()
                
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(content.encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def handle_list_mmd(self):
        try:
            # Find all .mmd files in the architecture diagrams directory
            mmd_files = glob.glob('docs/architecture/**/diagrams/*.mmd', recursive=True)
            
            # Format the files list with relative paths and display names
            files = []
            for file in mmd_files:
                display_name = os.path.basename(file).replace('.mmd', '')
                # Convert Windows paths to forward slashes if needed
                relative_path = file.replace('\\', '/')
                files.append({
                    'path': relative_path,
                    'name': display_name
                })

            # Send the response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(files).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

if __name__ == "__main__":
    server_address = ('', 8080)
    httpd = HTTPServer(server_address, DiagramHandler)
    print("Server running at http://localhost:8080/docs/tools/diagram-viewer.html")
    httpd.serve_forever()
