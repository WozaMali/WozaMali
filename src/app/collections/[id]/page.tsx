import CollectionDetailsClient from "./CollectionDetailsClient";

// Required for static export - return empty array for dynamic routes
export async function generateStaticParams() {
  // For static export, we need to return actual parameters
  // Since this is a dynamic route, we'll return a placeholder
  // The actual data will be loaded client-side
  return [
    { id: 'placeholder' }
  ];
}

export default function CollectionDetailsPage() {
  return <CollectionDetailsClient />;
}
