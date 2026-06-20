import os
import re
import html
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_html(html_text):
    """Convert HTML content into clean plain text for tweets."""
    # Replace common formatting tags with linebreaks or clean spaces
    text = re.sub(r'</p>\s*<p>', '\n\n', html_text)
    text = re.sub(r'<li>', '• ', text)
    text = re.sub(r'</li>', '\n', text)
    text = re.sub(r'<br\s*/?>', '\n', text)
    
    # Strip all remaining tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Unescape HTML entities (e.g. &amp;, &lt;, &#39;)
    text = html.unescape(text)
    
    # Normalize whitespaces but keep double linebreaks
    lines = [line.strip() for line in text.split('\n')]
    text = '\n'.join([line for line in lines if line])
    
    # Replace consecutive spaces with a single space
    text = re.compile(r'[ \t]+').sub(' ', text)
    return text.strip()

def parse_release_notes(xml_data):
    """Parse Atom XML feed and extract individual release note updates."""
    try:
        root = ET.fromstring(xml_data)
    except ET.ParseError as e:
        print(f"XML Parsing Error: {e}")
        return []

    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = []

    for entry_node in root.findall('atom:entry', ns):
        # Extract metadata
        title = entry_node.find('atom:title', ns)
        date_str = title.text.strip() if title is not None else "Unknown Date"
        
        id_node = entry_node.find('atom:id', ns)
        entry_id = id_node.text.strip() if id_node is not None else ""
        
        updated_node = entry_node.find('atom:updated', ns)
        updated_val = updated_node.text.strip() if updated_node is not None else ""
        
        link_node = entry_node.find("atom:link[@rel='alternate']", ns)
        link = link_node.attrib.get('href', '').strip() if link_node is not None else ''
        
        content_node = entry_node.find('atom:content', ns)
        content_html = content_node.text if content_node is not None else ''

        # Split entry content by <h3> tags
        matches = re.findall(r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)', content_html, re.DOTALL)
        
        if not matches:
            # Fallback if no <h3> tags are found
            plain_text = clean_html(content_html)
            entries.append({
                'id': f"{entry_id}_0",
                'date': date_str,
                'updated': updated_val,
                'link': link,
                'type': 'General',
                'html': content_html.strip(),
                'text': plain_text
            })
        else:
            for idx, (utype, ubody) in enumerate(matches):
                utype_clean = utype.strip()
                ubody_clean = ubody.strip()
                plain_text = clean_html(ubody_clean)
                
                # Make sure the link anchors to the specific date/entry if possible
                anchor = date_str.replace(',', '').replace(' ', '_')
                specific_link = f"https://docs.cloud.google.com/bigquery/docs/release-notes#{anchor}"
                
                entries.append({
                    'id': f"{entry_id}_{idx}",
                    'date': date_str,
                    'updated': updated_val,
                    'link': specific_link,
                    'type': utype_clean,
                    'html': ubody_clean,
                    'text': plain_text
                })
                
    return entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(FEED_URL, headers=headers, timeout=10)
        response.raise_for_status()
        
        releases = parse_release_notes(response.content)
        return jsonify({
            'success': True,
            'releases': releases
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
