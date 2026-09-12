// Next.js client-side navigation
import Link from 'next/link';
// React library
import React from 'react';

// Props for the Card component — a single report summary
interface CardProps {
  data: {
    _id: string;       // MongoDB document id
    name: string;      // Reporter's name
    location: string;  // "lat,lng" coordinates
    severity: string;  // Severity level of the incident
    issue: string;     // Short description
    other_info: string; // Additional notes
    // add other properties of data if needed
  };
}

// Clickable summary card that links to the full post detail page.
function Card({ data }: CardProps) {
  return (
    // The whole card is a link to the post detail page
    <Link
      href={`/post/${data._id}`}
      className="flex flex-col p-3 max-w-2xl w-full mx-auto border shadow-sm hover:scale-105 duration-200 cursor-pointer ease-in-out hover:shadow-md rounded-md"
    >
      {/* Top row: reporter name on the left, severity on the right */}
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg">{data.name}</h1>
        <p>{data.severity}</p>
      </div>
    </Link>
  );
}

export default Card;
