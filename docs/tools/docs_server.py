from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import json
import glob
import markdown
import re
import mimetypes

class DocsHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Change to the project root directory
        os.chdir(os.path.join(os.path.dirname(__file__), "../.."))
        super().__init__(*args, **kwargs)

    def do_GET(self):
        if self.path == '/list-docs':
            self.handle_list_docs()
        elif self.path == '/list-mmd':
            self.handle_list_mmd()
        elif self.path == '/list-mockups':
            self.handle_list_mockups()
        elif self.path.startswith('/read-mmd/'):
            self.handle_read_mmd()
        elif self.path.startswith('/read-doc/'):
            self.handle_read_doc()
        elif self.path.startswith('/read-file/'):
            self.handle_read_file()
        elif self.path.startswith('/mockup/'):
            self.handle_mockup()
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
            file_path = file_path.replace('%2F', '/')
            
            # Security check: ensure path is within docs directory
            if not file_path.startswith('docs/') or '..' in file_path:
                raise ValueError('Invalid file path')
                
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
            
        except Exception as e:
            print(f"Error reading mermaid diagram: {str(e)}")  # Debug output
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_read_doc(self):
        try:
            # Remove /read-doc/ prefix and decode the path
            file_path = self.path[10:]  # len('/read-doc/') == 10
            file_path = file_path.replace('%2F', '/')
            
            # Security check: ensure path is within docs directory
            if not file_path.startswith('docs/') or '..' in file_path:
                raise ValueError('Invalid file path')
                
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Convert markdown to HTML
            html_content = markdown.markdown(
                content,
                extensions=['fenced_code', 'tables', 'toc']
            )
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            # Extract title from first heading
            title = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
            title = title.group(1) if title else os.path.basename(file_path)
            
            response = {
                'title': title,
                'content': html_content,
                'path': file_path
            }
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            print(f"Error reading document: {str(e)}")  # Debug output
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_list_mmd(self):
        try:
            diagrams = []
            diagram_paths = [
                'docs/**/*.mmd'  # This will catch all .mmd files in any subdirectory under docs
            ]
            
            # Find all .mmd files in the docs directory
            for path in diagram_paths:
                diagram_files = glob.glob(path, recursive=True)
                for file in diagram_files:
                    # Skip files in node_modules or other unwanted directories
                    if 'node_modules' in file:
                        continue
                        
                    # Get display name from filename
                    display_name = os.path.basename(file).replace('.mmd', '')
                    display_name = display_name.replace('-', ' ').title()
                    
                    # Convert Windows paths to forward slashes if needed
                    relative_path = file.replace('\\', '/')
                    
                    # Get the category from the path
                    path_parts = relative_path.split('/')
                    category = path_parts[1] if len(path_parts) > 2 else 'Other'
                    category = category.replace('-', ' ').title()
                    
                    diagrams.append({
                        'path': relative_path,
                        'name': display_name,
                        'category': category
                    })

            # Sort diagrams by category and then by name
            diagrams.sort(key=lambda x: (x['category'], x['name']))

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'files': diagrams}).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_list_docs(self):
        try:
            docs = []
            # Get all supported file types from docs directory
            supported_types = {
                'md': 'doc',
                'mmd': 'diagram',
                'svg': 'svg',
                'html': 'html'
            }
            
            for ext, file_type in supported_types.items():
                for file_path in glob.glob(f'docs/**/*.{ext}', recursive=True):
                    # Convert path to use forward slashes
                    file_path = file_path.replace('\\', '/')
                    # Skip files in the tools directory
                    if '/tools/' in file_path:
                        continue
                    
                    name = os.path.basename(file_path)
                    # Remove extension and convert to title case
                    name = os.path.splitext(name)[0].replace('-', ' ').title()
                    
                    docs.append({
                        'path': file_path,
                        'name': name,
                        'type': file_type
                    })
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(docs).encode('utf-8'))
            
        except Exception as e:
            print(f"Error listing documents: {str(e)}")  # Debug output
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_read_file(self):
        try:
            # Remove /read-file/ prefix and decode the path
            file_path = self.path[11:]  # len('/read-file/') == 11
            file_path = file_path.replace('%2F', '/')
            
            # Security check: ensure path is within docs directory
            if not file_path.startswith('docs/') or '..' in file_path:
                raise ValueError('Invalid file path')
                
            # Get the file's mime type
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                mime_type = 'application/octet-stream'
            
            with open(file_path, 'rb') as f:
                content = f.read()
                
            self.send_response(200)
            self.send_header('Content-type', mime_type)
            self.end_headers()
            self.wfile.write(content)
            
        except Exception as e:
            print(f"Error reading file: {str(e)}")  # Debug output
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_mockup(self):
        try:
            # Remove /mockup/ prefix and decode the path
            file_path = self.path[8:]  # len('/mockup/') == 8
            
            # Security check: ensure path is within docs/architecture/target
            if not file_path.startswith('docs/current-project/') or '..' in file_path:
                raise ValueError('Invalid file path')
                
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_list_mockups(self):
        try:
            mockups = []
            mockup_paths = [
                'docs/current-project/diagrams/ui-mockup.html',
                'docs/current-project/mockups/*.png',
                'docs/current-project/mockups/*.jpg'
            ]
            
            # Find all .html files in the target/diagrams directory
            for path in mockup_paths:
                mockup_files = glob.glob(path, recursive=True)
                for file in mockup_files:
                    # Convert Windows paths to forward slashes if needed
                    relative_path = file.replace('\\', '/')
                    
                    # Read the file to get the title from the title tag
                    with open(file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        title_match = re.search(r'<title>(.*?)</title>', content)
                        title = title_match.group(1) if title_match else os.path.basename(file)

                    mockups.append({
                        'path': relative_path,
                        'name': title
                    })

            # Sort files by name
            mockups.sort(key=lambda x: x['name'])

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'files': mockups}).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

if __name__ == "__main__":
    server_address = ('', 8080)
    httpd = HTTPServer(server_address, DocsHandler)
    print("Documentation server running at http://localhost:8080/docs/tools/docs_viewer.html")
    httpd.serve_forever()
