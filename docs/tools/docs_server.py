from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import json
import markdown
import re
from pathlib import Path
import glob
import mimetypes

class DocsHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Change to the project root directory
        os.chdir(os.path.join(os.path.dirname(__file__), "../.."))
        super().__init__(*args, **kwargs)

    def do_GET(self):
        if self.path == '/docs-structure':
            self.handle_docs_structure()
        elif self.path == '/list-docs':
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

    def get_docs_structure(self, base_path='docs/architecture'):
        structure = []
        base = Path(base_path)
        
        # Define order of main sections
        section_order = {
            'common': 0,
            'react': 1,
            'electron': 2,
            'rust-core': 3
        }
        
        # Get all files and directories
        for path in sorted(base.rglob('*')):
            if path.name.startswith('.') or path.name.startswith('__'):
                continue
                
            rel_path = str(path.relative_to(base.parent))
            parts = list(path.relative_to(base).parts)
            
            if path.is_file():
                if path.suffix in ['.md', '.mmd']:
                    # Default title from filename
                    title = path.stem.replace('-', ' ').title()
                    
                    # For markdown files, try to extract the first heading
                    if path.suffix == '.md':
                        try:
                            with open(path, 'r', encoding='utf-8') as f:
                                content = f.read()
                                # Try to find a level 1 heading first
                                heading = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
                                if heading:
                                    title = heading.group(1).strip()
                                else:
                                    # If no level 1 heading, try level 2
                                    heading = re.search(r'^##\s+(.+)$', content, re.MULTILINE)
                                    if heading:
                                        title = heading.group(1).strip()
                                        
                                # Clean up the title
                                title = title.replace('\\', '')  # Remove escape characters
                                if ':' in title:  # Handle subtitles
                                    main_title = title.split(':')[0].strip()
                                    if len(main_title) > 3:  # Use main title if it's long enough
                                        title = main_title
                        except Exception as e:
                            print(f"Error reading title from {path}: {e}")
                            
                    # For mermaid files, add "Diagram:" prefix if it's not already a diagram title
                    elif path.suffix == '.mmd':
                        if not any(word in title.lower() for word in ['diagram', 'flow', 'chart', 'architecture']):
                            title = f"Diagram: {title}"
                    
                    # Create folder path for grouping
                    section = parts[0]
                    folder_path = '/'.join(parts[:-1]) if len(parts) > 1 else section
                    
                    structure.append({
                        'type': 'diagram' if path.suffix == '.mmd' else 'doc',
                        'path': rel_path,
                        'title': title,
                        'section': section,
                        'folder_path': folder_path if len(parts) > 1 else None,
                        'is_root_file': len(parts) == 1
                    })
        
        # Sort structure by section order and then by title
        structure.sort(key=lambda x: (
            section_order.get(x['section'], 999),
            0 if x['is_root_file'] else 1,  # Root files come first
            x.get('folder_path', ''),
            x['title']
        ))
        
        return structure

    def handle_docs_structure(self):
        try:
            structure = self.get_docs_structure()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(structure).encode('utf-8'))
            
        except Exception as e:
            print(f"Error getting docs structure: {str(e)}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_read_mmd(self):
        try:
            # Remove /read-mmd/ prefix and decode the path
            file_path = self.path[10:]  # len('/read-mmd/') == 10
            file_path = file_path.replace('%2F', '/')
            
            # Security check: ensure path is within docs directory
            if '..' in file_path:
                raise ValueError('Invalid file path')
            
            # Prepend docs/ if not already present
            if not file_path.startswith('docs/'):
                file_path = os.path.join('docs', file_path)
                
            # Ensure the file exists
            if not os.path.isfile(file_path):
                raise FileNotFoundError(f'File not found: {file_path}')
                
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
            
        except Exception as e:
            print(f"Error reading mermaid diagram: {str(e)}")
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
            if '..' in file_path:
                raise ValueError('Invalid file path')
            
            # Prepend docs/ if not already present
            if not file_path.startswith('docs/'):
                file_path = os.path.join('docs', file_path)
                
            # Ensure the file exists
            if not os.path.isfile(file_path):
                raise FileNotFoundError(f'File not found: {file_path}')
                
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
            print(f"Error reading document: {str(e)}")
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
