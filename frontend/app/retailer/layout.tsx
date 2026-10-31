import RetailerSidebar from "../components/RetailerSidebar";

export default function RetailerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sand">
      <RetailerSidebar />
      {/* Content area pushed right on desktop */}
      <div className="lg:pl-64">
        {children}
      </div>
    </div>
  );
}
