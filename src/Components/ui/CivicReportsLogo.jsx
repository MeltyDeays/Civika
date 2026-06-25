import logo from "../../assets/civicreports_logo.png";

export default function CivicReportsLogo({ height = 32, className = "" }) {
  return (
    <img
      src={logo}
      alt="CivicReports"
      className={className}
      style={{ height, width: "auto", objectFit: "contain", display: "block" }}
      draggable={false}
    />
  );
}
