
import React from 'react';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from './icons';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  if (totalItems === 0) return null;
    
  const totalPages = itemsPerPage > 0 ? Math.ceil(totalItems / itemsPerPage) : 1;
  
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = Number(e.target.value);
      onItemsPerPageChange(newValue);
      onPageChange(1); // Reset to first page
  }

  const baseButtonClasses = "py-1 border rounded-md bg-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 hover:bg-slate-50 transition-colors";
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 print:hidden bg-white p-4 rounded-lg shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 text-sm text-slate-600 mb-4 sm:mb-0">
        <div className="flex items-center gap-2">
            <span>แสดง</span>
            <select 
                value={itemsPerPage} 
                onChange={handleItemsPerPageChange} 
                className="p-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-700 font-medium cursor-pointer hover:border-blue-400 transition-colors"
            >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={0}>ทั้งหมด (All)</option>
            </select>
            <span>รายการ</span>
        </div>
        <span className="text-slate-400">|</span>
        <span>พบข้อมูลทั้งหมด {totalItems.toLocaleString()} รายการ</span>
      </div>
      
      {(itemsPerPage > 0 && totalPages > 1) && (
        <nav aria-label="Pagination">
          <ul className="flex items-center gap-1">
            <li>
                <button
                    onClick={() => onPageChange(1)}
                    disabled={isFirstPage}
                    className={`${baseButtonClasses} px-2 text-slate-500 hover:text-blue-600`}
                    aria-label="Go to first page"
                    title="หน้าแรก"
                >
                    <ChevronDoubleLeftIcon />
                </button>
            </li>
            <li>
                <button 
                    onClick={() => onPageChange(currentPage - 1)} 
                    disabled={isFirstPage} 
                    className={`${baseButtonClasses} px-3 text-slate-700`}
                    aria-label="Go to previous page"
                >
                    ก่อนหน้า
                </button>
            </li>
            <li>
                <span className="px-4 py-1 text-sm font-medium text-blue-700 bg-blue-50 rounded-md border border-blue-100 mx-1">
                    {currentPage.toLocaleString()} / {totalPages.toLocaleString()}
                </span>
            </li>
            <li>
                <button 
                    onClick={() => onPageChange(currentPage + 1)} 
                    disabled={isLastPage} 
                    className={`${baseButtonClasses} px-3 text-slate-700`}
                    aria-label="Go to next page"
                >
                    ถัดไป
                </button>
            </li>
            <li>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={isLastPage}
                    className={`${baseButtonClasses} px-2 text-slate-500 hover:text-blue-600`}
                    aria-label="Go to last page"
                    title="หน้าสุดท้าย"
                >
                    <ChevronDoubleRightIcon />
                </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default Pagination;
