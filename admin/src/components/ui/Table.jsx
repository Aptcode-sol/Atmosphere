import './Table.css';

const Table = ({ children, className = '' }) => {
    return (
        <div className="table-wrapper">
            <table className={`table ${className}`}>
                {children}
            </table>
        </div>
    );
};

export const TableHead = ({ children }) => <thead>{children}</thead>;
export const TableBody = ({ children }) => <tbody>{children}</tbody>;
export const TableRow = ({ children, className = '' }) => (
    <tr className={className}>{children}</tr>
);
export const TableHeader = ({ children, className = '' }) => (
    <th className={className}>{children}</th>
);
export const TableCell = ({ children, className = '' }) => (
    <td className={className}>{children}</td>
);

export default Table;
