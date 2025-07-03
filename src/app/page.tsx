"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export default function Home() {
  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [advocates, setAdvocates] = useState([]);
  const [filteredAdvocates, setFilteredAdvocates] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // Ref for search input and initial load tracking
  const searchInputRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Fetch advocates with pagination and search
  const fetchAdvocates = useCallback((page = 1, limit = itemsPerPage, search = '', isInitialLoad = false) => {
    console.log(`fetching advocates... page: ${page}, limit: ${limit}, search: ${search}`);
    if (isInitialLoad) {
      setIsLoading(true);
    }
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search.trim()) {
      params.append('search', search);
    }
    
    fetch(`/api/advocates?${params.toString()}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch advocates');
        }
        return response.json();
      })
      .then((jsonResponse) => {
        setAdvocates(jsonResponse.data);
        setFilteredAdvocates(jsonResponse.data);

        // Update pagination state
        if (jsonResponse.pagination) {
          setCurrentPage(jsonResponse.pagination.page);
          setTotalPages(jsonResponse.pagination.totalPages);
          setTotalItems(jsonResponse.pagination.totalItems);
          setHasNextPage(jsonResponse.pagination.hasNextPage);
          setHasPreviousPage(jsonResponse.pagination.hasPreviousPage);
        }
        
        if (isInitialLoad) {
          setIsLoading(false);
        }
        setIsSearching(false);
      })
      .catch((err) => {
        console.error('Error fetching advocates:', err);
        setError(err.message);
        if (isInitialLoad) {
          setIsLoading(false);
        }
        setIsSearching(false);
      });
  }, [itemsPerPage]);

  // Debounce search term and reset page
  useEffect(() => {
    // Set searching state when user is typing
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    }

    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      // Reset to page 1 when search changes (but not on initial empty load)
      if (searchTerm.trim() !== debouncedSearchTerm.trim() && currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, debouncedSearchTerm, currentPage]);

  // Fetch data when page, itemsPerPage, or debouncedSearchTerm changes
  useEffect(() => {
    const shouldSetLoading = isInitialLoad.current;
    fetchAdvocates(currentPage, itemsPerPage, debouncedSearchTerm, shouldSetLoading);
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, fetchAdvocates]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Generate page numbers for pagination UI
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, and pages around current
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Generate avatar URL using UI Avatars service
  const getAvatarUrl = (firstName, lastName) => {
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
    const bgColors = ['5B21B6', '1E40AF', 'DC2626', '059669', 'D97706', '7C3AED', 'DB2777', '0891B2'];
    const colorIndex = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % bgColors.length;
    const bgColor = bgColors[colorIndex];
    return `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=fff&size=128&bold=true`;
  };

  // Loading component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-10 w-full">
      <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  // Error component
  const ErrorMessage = ({ message }) => (
    <div className="text-center p-10 text-red-600">
      <p className="mb-4">Error: {message}</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Retry
      </button>
    </div>
  );

  // Card skeleton loader
  const CardSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full mr-4"></div>
        <div>
          <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  );

  // Advocate Card Component
  const AdvocateCard = ({ advocate }) => (
    <div className="bg-green-300 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
      <div className="flex items-center mb-4">
        {/* Note: I am keeping this as <img> because SVGs are better for scalability and the ui-avators service will only return png */}
        <img
          src={getAvatarUrl(advocate.firstName, advocate.lastName)}
          alt={`${advocate.firstName} ${advocate.lastName}`}
          className="w-16 h-16 rounded-full mr-4"
        />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {advocate.firstName} {advocate.lastName}
          </h3>
          <p className="text-sm text-gray-600">{advocate.degree}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-gray-700">{advocate.city}</span>
        </div>

        <div className="flex items-center text-sm">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-700">{advocate.yearsOfExperience} years experience</span>
        </div>

        <div className="flex items-center text-sm">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-gray-700">{advocate.phoneNumber}</span>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Specialties</p>
        <div className="flex flex-wrap gap-1">
          {advocate.specialties.map((specialty, index) => (
            <span
              key={index}
              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
            >
              {specialty}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  // Pagination Component
  const Pagination = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-8 space-y-4 sm:space-y-0">
      {/* Items per page selector */}
      <div className="flex items-center space-x-2">
        <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
          Show:
        </label>
        <select
          id="itemsPerPage"
          value={itemsPerPage}
          onChange={handleItemsPerPageChange}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
        <span className="text-sm text-gray-700">per page</span>
      </div>

      {/* Page navigation */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && handlePageChange(page)}
              disabled={page === '...'}
              className={`px-3 py-1 text-sm rounded-md ${
                page === currentPage
                  ? 'bg-blue-500 text-white'
                  : page === '...'
                  ? 'cursor-default'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Results info */}
      <div className="text-sm text-gray-700">
        {searchTerm ? (
          <span>Showing {filteredAdvocates.length} filtered results</span>
        ) : (
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} advocates
          </span>
        )}
      </div>
    </div>
  );

  if (error) {
    return (
      <main className="m-6">
        <h1 className="text-3xl font-bold text-gray-900">Solace Advocates</h1>
        <ErrorMessage message={error} />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="p-6">
        <h1 className="text-3xl text-center font-bold text-gray-900 mb-8">Solace Healthcare Advocates</h1>

        <div className="mb-6">
          <div className="justify-center flex gap-2">
            <input
              ref={searchInputRef}
              className="w-full max-w-2xl px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={handleSearch}
              value={searchTerm}
              placeholder="Find a patient advocate by name, specialty, location, or credential..."
            />
          </div>
        </div>

        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(itemsPerPage)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : isSearching ? (
            <LoadingSpinner />
          ) : filteredAdvocates.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg">No advocates found {searchTerm ? `for "${searchTerm}"` : ''}</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAdvocates.map((advocate, index) => (
                  <AdvocateCard key={index} advocate={advocate} />
                ))}
              </div>
              
              {/* Show pagination when not searching */}
              {!searchTerm.trim() && <Pagination />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}