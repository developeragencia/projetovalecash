import * as React from "react";

export function ShareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

export function LogoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 5l-7-3-7 3" />
      <path d="M5 6.5v6.5l7 3 7-3v-6.5" />
      <path d="M5 13l7 3 7-3" fill="currentColor" strokeOpacity="0.5" />
      <path d="M12 16v4" />
      <path d="M8 13.5v2.5l4 2 4-2v-2.5" stroke="currentColor" strokeOpacity="0.7" />
    </svg>
  );
}

export function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.1768 3.74033C17.9332 1.49908 14.9465 0.272754 11.7854 0.272754C5.30974 0.272754 0.0434977 5.52866 0.0434977 11.9926C0.0434977 14.0756 0.642364 16.1039 1.78464 17.8665L0 24.2727L6.54487 22.5265C8.24794 23.5588 10.1951 24.0919 12.1865 24.0919H12.1949C18.6689 24.0919 24 18.8343 24 12.371C24 9.21831 22.4203 6.23147 20.1768 3.74033ZM11.7938 22.0637C10.0358 22.0637 8.31147 21.5473 6.81003 20.5734L6.47107 20.363L2.8058 21.3954L3.85827 17.8248L3.62613 17.4693C2.55346 15.9029 1.99555 14.073 1.99555 12.1843C1.99555 6.549 6.3458 2.20925 11.9855 2.20925C14.6387 2.20925 17.1233 3.24344 19.0209 5.15886C20.9185 7.07428 21.8802 9.57722 21.8802 12.2322C21.8802 17.8665 17.4331 22.0637 11.7938 22.0637ZM17.1317 14.6169C16.8472 14.4737 15.4083 13.7655 15.1489 13.6724C14.8894 13.5792 14.6966 13.5309 14.5037 13.8164C14.3109 14.1019 13.7555 14.7602 13.5844 14.9528C13.4134 15.1454 13.2506 15.1686 12.9661 15.0253C10.7475 13.9166 9.29507 13.0351 7.85095 10.5488C7.51198 9.98273 8.0256 9.9994 8.50161 9.04618C8.59461 8.85352 8.54636 8.68419 8.47359 8.54096C8.40081 8.39774 7.90136 6.9612 7.6586 6.39508C7.42364 5.84563 7.18047 5.92909 7.00203 5.92909C6.82358 5.92909 6.63074 5.90587 6.43789 5.90587C6.24504 5.90587 5.9372 5.97852 5.67775 6.264C5.41831 6.54948 4.66273 7.25769 4.66273 8.69422C4.66273 10.1307 5.72713 11.5257 5.86663 11.7182C6.00614 11.9108 7.87587 14.848 10.7725 16.0862C12.6284 16.8528 13.3673 16.9127 14.2962 16.7667C14.8765 16.6735 16.0221 16.0401 16.2648 15.3785C16.5076 14.7169 16.5076 14.1508 16.4348 14.0344C16.3621 13.918 16.1693 13.8481 15.8847 13.7049L17.1317 14.6169Z"
      />
    </svg>
  );
}

export function LucideSvgIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
      <path d="M9 18c-4.51 2-5-2-7-2"></path>
    </svg>
  );
}