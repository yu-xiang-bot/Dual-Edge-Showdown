#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的HTTP服务器，确保正确处理UTF-8编码
"""
import http.server
import socketserver
import os

class UTF8HTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 确保HTML文件使用UTF-8编码
        if self.path.endswith('.html') or self.path.endswith('/'):
            self.send_header('Content-Type', 'text/html; charset=utf-8')
        # 确保JavaScript文件使用UTF-8编码
        elif self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript; charset=utf-8')
        # 确保CSS文件使用UTF-8编码
        elif self.path.endswith('.css'):
            self.send_header('Content-Type', 'text/css; charset=utf-8')
        super().end_headers()

PORT = 8000

with socketserver.TCPServer(("", PORT), UTF8HTTPRequestHandler) as httpd:
    print(f"服务器运行在 http://localhost:{PORT}")
    print("按 Ctrl+C 停止服务器")
    httpd.serve_forever()

