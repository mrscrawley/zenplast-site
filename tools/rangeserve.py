# Простой статический сервер с поддержкой Range (для перемотки видео при локальной проверке)
import http.server, os, re, sys
class H(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path): return super().send_head()
        rng = self.headers.get('Range')
        if not rng or not os.path.isfile(path): return super().send_head()
        size = os.path.getsize(path); m = re.match(r'bytes=(\d*)-(\d*)', rng)
        start = int(m.group(1) or 0); end = int(m.group(2)) if m.group(2) else size - 1
        end = min(end, size - 1); f = open(path, 'rb'); f.seek(start)
        self.send_response(206); self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Accept-Ranges', 'bytes'); self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end - start + 1)); self.end_headers()
        self._left = end - start + 1; return f
    def copyfile(self, src, dst):
        left = getattr(self, '_left', None)
        if left is None: return super().copyfile(src, dst)
        while left > 0:
            b = src.read(min(65536, left))
            if not b: break
            dst.write(b); left -= len(b)
    def end_headers(self):
        if not self.headers.get('Range'): self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()
os.chdir(sys.argv[1]); http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[2])), H).serve_forever()
