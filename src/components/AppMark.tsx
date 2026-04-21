import logo from "@/assets/logo.png";

export default function AppMark({ className = "h-14 w-14 md:h-16 md:w-16 text-2xl" }: { className?: string }) {
  return (
    <div className={`grid place-items-center rounded-2xl  ${className}`}>
      <img
        src={logo}
        alt="Logo"
        className="max-h-full max-w-full object-contain p-1"
      />
    </div>
  );
}
