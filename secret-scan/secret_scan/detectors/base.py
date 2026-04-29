from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Optional

from secret_scan.models import Finding


class BaseDetector(ABC):
    """
    Abstract base class for all secret detectors.
    """

    @abstractmethod
    def detect(self, content: str, file_path: Optional[str] = None) -> List[Finding]:
        """
        Detect secrets in the given content.

        Args:
            content: The content to scan for secrets.
            file_path: Optional path to the file being scanned (for context).

        Returns:
            A list of Finding objects representing detected secrets.
        """
        pass

    @abstractmethod
    def get_id(self) -> str:
        """
        Return a unique identifier for this detector.

        Returns:
            String identifier for the detector.
        """
        pass

    @abstractmethod
    def get_name(self) -> str:
        """
        Return a human-readable name for this detector.

        Returns:
            Human-readable name.
        """
        pass
