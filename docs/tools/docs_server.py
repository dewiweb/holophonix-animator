from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import json
import glob
import markdown
import re

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
            
            # Security check: ensure path is within docs/architecture
            if not file_path.startswith('docs/current-project/') and not file_path.startswith('docs/old-project/') and not file_path.startswith('docs/technical/') or '..' in file_path:
                raise ValueError('Invalid file path')
                
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_read_doc(self):
        try:
            # Remove /read-doc/ prefix and decode the path
            file_path = self.path[10:]  # len('/read-doc/') == 10
            
            # Security check: ensure path is within docs/architecture/target
            if not file_path.startswith('docs/current-project/') and not file_path.startswith('docs/old-project/') and not file_path.startswith('docs/technical/') and not file_path.startswith('docs/tools/') or '..' in file_path:
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
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_list_mmd(self):
        try:
            diagrams = []
            diagram_paths = [
                'docs/current-project/**/*.mmd',
                'docs/old-project/**/*.mmd',
                'docs/technical/**/*.mmd'
            ]
            
            # Find all .mmd files in the architecture diagrams directory
            for path in diagram_paths:
                diagram_files = glob.glob(path, recursive=True)
                for file in diagram_files:
                    display_name = os.path.basename(file).replace('.mmd', '')
                    # Convert Windows paths to forward slashes if needed
                    relative_path = file.replace('\\', '/')
                    diagrams.append({
                        'path': relative_path,
                        'name': display_name
                    })

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
            doc_paths = [
                'docs/current-project/**/*.md',
                'docs/old-project/**/*.md',
                'docs/technical/**/*.md',
                'docs/tools/**/*.md'
            ]
            
            # Find all .md files in the target directory
            for path in doc_paths:
                md_files = glob.glob(path, recursive=True)
                for file in md_files:
                    # Read the file to get the title from the first heading
                    with open(file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        title = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
                        title = title.group(1) if title else os.path.basename(file)

                    # Convert Windows paths to forward slashes if needed
                    relative_path = file.replace('\\', '/')
                    docs.append({
                        'path': relative_path,
                        'name': title
                    })

            # Sort files by name
            docs.sort(key=lambda x: x['name'])

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'files': docs}).encode('utf-8'))
        except Exception as e:
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
