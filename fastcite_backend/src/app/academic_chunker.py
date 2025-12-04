import fitz  # PyMuPDF
from typing import List, Dict, Optional
import uuid
import os


class AcademicPDFChunker:
    """
    Chunker for academic PDFs without Table of Contents.
    Uses page-based chunking with configurable page ranges and overlap.
    """
    
    def __init__(self, pdf_path: str, book_id: str, output_dir: Optional[str] = None, 
                 pages_per_chunk: int = 3, overlap_pages: int = 1):
        """
        Initialize the AcademicPDFChunker with a PDF file.
        
        Args:
            pdf_path: Path to the PDF file
            book_id: Book ID to use for mini PDFs
            output_dir: Directory to save mini PDFs (default: "pdfs" in current directory)
            pages_per_chunk: Number of pages per chunk (default: 3)
            overlap_pages: Number of overlapping pages between chunks (default: 1)
        """
        self.pdf_path = pdf_path
        self.doc = fitz.open(pdf_path)
        self.chunks: List[Dict] = []
        self.bookid = book_id
        self.pages_per_chunk = pages_per_chunk
        self.overlap_pages = overlap_pages
        
        # Set output directory for mini PDFs
        if output_dir is None:
            base_dir = os.getcwd()
        else:
            base_dir = os.path.abspath(output_dir)
        self.output_dir = os.path.join(base_dir, "pdfs")
        os.makedirs(self.output_dir, exist_ok=True)
    
    def get_page_text(self, page_num: int) -> str:
        """Extract text from a specific page."""
        page = self.doc[page_num]
        return page.get_text()
    
    def extract_text_between_pages(self, start_page: int, end_page: int) -> str:
        """
        Extract text between two pages (inclusive).
        
        Args:
            start_page: Starting page (0-indexed)
            end_page: Ending page (0-indexed, inclusive)
            
        Returns:
            Extracted text
        """
        text_parts = []
        for page_num in range(start_page, end_page + 1):
            if 0 <= page_num < len(self.doc):
                page_text = self.get_page_text(page_num)
                text_parts.append(page_text)
        return '\n'.join(text_parts)
    
    def process_chunks(self) -> List[Dict]:
        """
        Process the PDF and create chunks based on page ranges.
        
        Returns:
            List of chunk dictionaries
        """
        chunks = []
        num_pages = len(self.doc)
        
        if num_pages == 0:
            raise ValueError("PDF has no pages")
        
        # Calculate step size (pages_per_chunk - overlap_pages)
        step_size = max(1, self.pages_per_chunk - self.overlap_pages)
        
        # Create chunks with overlap
        current_page = 0
        chunk_index = 0
        
        while current_page < num_pages:
            # Calculate end page for this chunk
            end_page = min(current_page + self.pages_per_chunk - 1, num_pages - 1)
            
            # Extract text for this chunk
            text = self.extract_text_between_pages(current_page, end_page)
            
            # Skip empty chunks
            if not text.strip():
                current_page += step_size
                continue
            
            # Generate a title based on first few words or page range
            title = self._generate_chunk_title(text, chunk_index, current_page + 1, end_page + 1)
            
            # Create chunk dictionary
            chunk = {
                "bookid": self.bookid,
                "chunkid": str(uuid.uuid4()),
                "title": title,
                "path": f"Page {current_page + 1}-{end_page + 1}",
                "level": 1,  # All chunks are at level 1 for academic PDFs
                "start_page": current_page + 1,  # 1-indexed
                "end_page": end_page + 1,  # 1-indexed
                "text": text.strip(),
                "related_paths": [],
                "mini_pdf_path": None  # Will be set when saving mini PDF
            }
            
            chunks.append(chunk)
            
            # Move to next chunk position
            current_page += step_size
            chunk_index += 1
        
        # Save mini PDFs for each chunk
        for chunk in chunks:
            mini_pdf_path = self._save_mini_pdf(chunk)
            chunk['mini_pdf_path'] = mini_pdf_path
        
        self.chunks = chunks
        
        print(f"✅ Created {len(chunks)} chunks from academic PDF (pages: {num_pages})")
        return chunks
    
    def _generate_chunk_title(self, text: str, chunk_index: int, start_page: int, end_page: int) -> str:
        """
        Generate a title for a chunk based on its content or page range.
        
        Args:
            text: Chunk text
            chunk_index: Index of the chunk
            start_page: Starting page number (1-indexed)
            end_page: Ending page number (1-indexed)
            
        Returns:
            Generated title
        """
        # Try to extract a heading from the first few lines
        lines = text.strip().split('\n')[:5]  # First 5 lines
        for line in lines:
            line = line.strip()
            # Look for lines that might be headings (short, capitalized, etc.)
            if line and len(line) < 100 and len(line.split()) < 15:
                # Check if it looks like a heading (starts with capital, not too long)
                if line[0].isupper() and not line.endswith('.'):
                    return line[:80]  # Truncate if too long
        
        # Fallback: use page range
        if start_page == end_page:
            return f"Page {start_page}"
        else:
            return f"Pages {start_page}-{end_page}"
    
    def _save_mini_pdf(self, chunk: Dict) -> str:
        """
        Save a mini PDF containing only the pages for this chunk.
        
        Args:
            chunk: The chunk dictionary with start_page and end_page
            
        Returns:
            Path to the saved mini PDF file
        """
        start_page = chunk['start_page']  # 1-indexed
        end_page = chunk['end_page']  # 1-indexed, inclusive
        
        # Convert to 0-indexed for PyMuPDF
        start_page_0 = start_page - 1
        end_page_0 = end_page - 1
        
        # Create a new PDF document
        mini_doc = fitz.open()
        
        # Copy pages from the original document
        for page_num in range(start_page_0, end_page_0 + 1):
            if 0 <= page_num < len(self.doc):
                mini_doc.insert_pdf(self.doc, from_page=page_num, to_page=page_num)
        
        # Generate filename: bookid_startpage_endpage.pdf
        filename = f"{self.bookid}_{start_page}_{end_page}.pdf"
        filepath = os.path.join(self.output_dir, filename)
        
        # Save the mini PDF
        mini_doc.save(filepath)
        mini_doc.close()
        
        return filepath
    
    def close(self):
        """Close the PDF document."""
        self.doc.close()

