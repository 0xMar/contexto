import pytest
from unittest.mock import AsyncMock, patch
from app.core.document_processor import process_document

@pytest.mark.asyncio
async def test_process_document_pdf_success():
    # Mock content
    content = b"%PDF-1.4 test content"
    extension = ".pdf"
    filename = "test.pdf"
    session_id = "test-session"

    with patch("app.core.document_processor.PyPDFLoader") as mock_loader:
        mock_instance = mock_loader.return_value
        mock_instance.load.return_value = [AsyncMock(page_content="page 1", metadata={})]
        
        with patch("app.core.document_processor.get_vectorstore") as mock_vs:
            mock_vectorstore = mock_vs.return_value
            
            result = await process_document(content, extension, filename, session_id)
            
            assert result == filename
            mock_vectorstore.add_documents.assert_called_once()

@pytest.mark.asyncio
async def test_process_document_unsupported_extension():
    content = b"some content"
    extension = ".exe"
    filename = "test.exe"
    session_id = "test-session"

    with pytest.raises(ValueError, match="Unsupported file type"):
        await process_document(content, extension, filename, session_id)
