import { EntryStatus } from "@/components/student/EntryStatusBadge";

export interface LogbookEntryItem {
  id: string;
  entryDate: string;
  activityDescription: string;
  skillsGained?: string;
  challenges?: string;
  hoursWorked: number;
  status: EntryStatus;
  attachmentName?: string;
  submittedAt?: string;
  supervisorFeedback?: {
    action: "approved" | "rejected";
    comment?: string;
    supervisorName: string;
    reviewedAt: string;
  };
}

export const INITIAL_MOCK_ENTRIES: LogbookEntryItem[] = [
  {
    id: "entry-101",
    entryDate: "2026-09-04",
    activityDescription:
      "Configured Cisco Catalyst 2960-X series switches for VLAN segmentation across Subnet 192.168.10.0/24 (Engineering) and 192.168.20.0/24 (Finance). Established 802.1Q trunking with native VLAN hardening.",
    skillsGained:
      "Cisco IOS CLI, 802.1Q VLAN trunking, STP root bridge priority configuration",
    challenges:
      "Encountered native VLAN mismatch warnings on trunk link Gi0/1; resolved by aligning native VLAN ID across core switches.",
    hoursWorked: 8.0,
    status: "approved",
    submittedAt: "2026-09-04T17:30:00Z",
    supervisorFeedback: {
      action: "approved",
      supervisorName: "Dr. Babatunde Adeyemi",
      reviewedAt: "2026-09-05T09:15:00Z",
    },
  },
  {
    id: "entry-102",
    entryDate: "2026-09-03",
    activityDescription:
      "Conducted multimode optical fiber link attenuation testing using an Optical Time-Domain Reflectometer (OTDR) along the primary backbone between Data Center A and Server Room B. Documented dB/km loss readings.",
    skillsGained:
      "Fiber optic link budget calculation, OTDR trace analysis, LC/SC connector cleaning protocols",
    challenges:
      "Dirty connector ferrule caused excessive reflective loss at splice point 3; rectified via precision isopropyl alcohol cleaning swabs.",
    hoursWorked: 7.5,
    status: "submitted",
    submittedAt: "2026-09-03T16:45:00Z",
  },
  {
    id: "entry-103",
    entryDate: "2026-09-02",
    activityDescription:
      "Troubleshot DHCP scope exhaustion on the corporate guest Wi-Fi VLAN. Extended pool subnet from /24 to /23 and adjusted lease expiry durations from 24h to 4h to reclaim stale leases.",
    skillsGained:
      "Windows Server DHCP Server management, IPAM scope administration, Wi-Fi lease timers",
    challenges:
      "Initial mitigation omitted DNS server relay address; supervisor requested documenting the full scope reservation table.",
    hoursWorked: 8.0,
    status: "needs_correction",
    submittedAt: "2026-09-02T18:00:00Z",
    supervisorFeedback: {
      action: "rejected",
      comment:
        "Please specify the exact pool address range configured and explain why 4-hour lease timers are appropriate for high-turnover guest zones.",
      supervisorName: "Dr. Babatunde Adeyemi",
      reviewedAt: "2026-09-03T11:20:00Z",
    },
  },
  {
    id: "entry-104",
    entryDate: "2026-09-01",
    activityDescription:
      "Automated weekly backup verification routine for virtual machines hosted on VMware ESXi 8.0 cluster. Wrote a PowerShell PowerCLI script to check backup snapshots and alert on failures.",
    skillsGained:
      "VMware vSphere PowerCLI, ESXi snapshot lifecycle, automated email alerting",
    challenges:
      "PowerCLI credential security in scheduled tasks; configured credential encryption via Windows DPAPI.",
    hoursWorked: 8.0,
    status: "approved",
    submittedAt: "2026-09-01T17:15:00Z",
    supervisorFeedback: {
      action: "approved",
      supervisorName: "Dr. Babatunde Adeyemi",
      reviewedAt: "2026-09-02T10:00:00Z",
    },
  },
  {
    id: "entry-105",
    entryDate: "2026-08-31",
    activityDescription:
      "Prepared draft observations regarding server room environmental sensor telemetry. Collected ambient temperature, humidity, and airflow readings across 6 server racks.",
    skillsGained:
      "Data center climate telemetry, SNMP sensor querying, Grafana dashboard basics",
    challenges:
      "Sensor probe in Rack 4 reported intermittent packet timeouts; traced to a loose RJ45 patch cable.",
    hoursWorked: 4.5,
    status: "draft",
  },
];
