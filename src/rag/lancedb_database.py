import os
import lancedb
import pandas as pd
import pyarrow as pa
from typing import Literal, Any
from dataclasses import field, dataclass

@dataclass
class VectorStoreItem:
    id: str | int
    timestamp: str | None
    content_type: str

    content: str | None
    vector: list[float] | None

    attributes: dict[str, Any] = field(default_factory=dict)

class LanceDBDatabase():
    def __init__(
            self, 
            db_url: str,
            collection_name: str,
        ):
        self.db_url = db_url
        self.collection_name = collection_name

    def connect(self):
        """Connect to the LanceDB database""" 
        self.db_connection = lancedb.connect(self.db_url)
        
        if (self.collection_name and self.collection_name in self.db_connection.table_names()):
            self.collection = self.db_connection.open_table(self.collection_name)

    def load_data(
            self,
            data: list[VectorStoreItem],
            overwrite: bool = False,
        ):
        """Load data into the LanceDB database"""

        data = [
            {
                "id": item.id,
                "timestamp": item.timestamp,
                "content_type": item.content_type,
                "content": item.content,
                "vector": item.vector,
                "attributes": item.attributes,
            }
            for item in data
        ]
        
        schema = pa.schema({
            "id": pa.string(),
            "timestamp": pa.string(),
            "content_type": pa.string(),
            "content": pa.string(),
            "vector": pa.list_(pa.float64()),
            "attributes": pa.string(),
        })

        # Check if table exists
        table_exists = self.collection_name in self.db_connection.table_names()
        
        if overwrite or not table_exists:
            # Create new table (either overwrite existing or create new)
            if data:
                self.collection = self.db_connection.create_table(self.collection_name, data=data, mode="overwrite" if overwrite else "create")
            else:
                self.collection = self.db_connection.create_table(self.collection_name, schema=schema, mode="overwrite" if overwrite else "create")
        else:
            # Table exists and we don't want to overwrite, so add data to existing table
            self.collection = self.db_connection.open_table(self.collection_name)
            if data:
                self.collection.add(data)
    
    def search_by_content(
        self,
        query: str,
        search_column: str = "content",
        case_sensitive: bool = False
    ):
        """
        Search for text content in the database using substring matching.
        
        Args:
            query: The text to search for
            search_column: The column name to search in (default: "content")
            case_sensitive: Whether the search should be case sensitive (default: False)
            
        Returns:
            List of dictionaries containing matching records
            
        Raises:
            ValueError: If search_column doesn't exist or search fails
        """
        if not query or not query.strip():
            return []
            
        try:
            # Convert to pandas DataFrame for efficient text search
            df = self.collection.to_pandas()
            
            # Validate search column exists
            if search_column not in df.columns:
                available_columns = list(df.columns)
                raise ValueError(
                    f"Column '{search_column}' not found in table. "
                    f"Available columns: {available_columns}"
                )
            
            # Create search mask with case sensitivity option
            mask = df[search_column].str.contains(
                query.strip(), 
                case=case_sensitive,
                na=False,
                regex=False  # Disable regex for better performance
            )
            
            # Filter results
            filtered_df = df[mask]
            
            # Convert to list of dictionaries
            results = filtered_df.to_dict('records')
            
            return results
            
        except Exception as e:
            # Provide more specific error information
            if "to_pandas" in str(e):
                raise ValueError("Failed to read data from database. Please check if the table exists and contains data.")
            elif "str.contains" in str(e):
                raise ValueError(f"Failed to search in column '{search_column}'. The column may not contain text data.")
            else:
                raise ValueError(f"Search failed: {str(e)}")
            
    
    def search_by_timestamp_range(
        self,
        start_timestamp: str = None,
        end_timestamp: str = None,
        search_column: str = "timestamp"
    ):
        """
        Search for records within a timestamp range.
        
        Args:
            start_timestamp: Start timestamp (inclusive). If None, searches from earliest time
            end_timestamp: End timestamp (inclusive). If None, searches to latest time
            search_column: The column name containing timestamps (default: "timestamp")
            
        Returns:
            List of dictionaries containing records within the specified time range
            
        Raises:
            ValueError: If search_column doesn't exist or timestamp format is invalid
        """
        try:
            df = self.collection.to_pandas()
            
            # Validate search column exists
            if search_column not in df.columns:
                available_columns = list(df.columns)
                raise ValueError(
                    f"Column '{search_column}' not found in table. "
                    f"Available columns: {available_columns}"
                )
            
            # Convert timestamp column to datetime for proper comparison
            df[search_column] = pd.to_datetime(df[search_column], errors='coerce')
            
            # Remove rows with invalid timestamps
            df = df.dropna(subset=[search_column])
            
            if df.empty:
                return []
            
            # Create time range mask
            mask = pd.Series([True] * len(df), index=df.index)
            
            # Apply start timestamp filter
            if start_timestamp:
                start_dt = pd.to_datetime(start_timestamp)
                mask &= (df[search_column] >= start_dt)
            
            # Apply end timestamp filter
            if end_timestamp:
                end_dt = pd.to_datetime(end_timestamp)
                mask &= (df[search_column] <= end_dt)
            
            # Filter results and create a copy to avoid SettingWithCopyWarning
            filtered_df = df[mask].copy()
            
            # Convert back to string format for consistency
            filtered_df.loc[:, search_column] = filtered_df[search_column].dt.strftime('%Y-%m-%d %H:%M:%S')
            
            return filtered_df.to_dict('records')
            
        except Exception as e:
            if "to_datetime" in str(e):
                raise ValueError(f"Invalid timestamp format. Please use ISO format (e.g., '2024-01-01 12:00:00')")
            else:
                raise ValueError(f"Search failed: {str(e)}")
            
    
    def search_by_content_type(
        self,
        content_type: str,
        search_column: str = "content_type"
    ):
        """Search for records by content type"""
        try:
            df = self.collection.to_pandas()
            mask = df[search_column] == content_type
            return df[mask].to_dict('records')
        
        except Exception as e:
            raise ValueError(f"Search failed: {str(e)}")

