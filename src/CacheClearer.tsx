function CacheClearer() {
    // Function to clear local cache
    const clearLocalCache = () => {
      localStorage.clear(); // Clears all items in local storage
      console.log('Local cache cleared.');
    };
  
    return (
      <>
        <button onClick={clearLocalCache}>Clear Local Cache</button>
      </>
    );
  }
  
  export default CacheClearer;