export interface ContainerStatus {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  created: number;
  tenantId?: string;
  subdomain?: string;
}

export interface DockerStatusResponse {
  containers: ContainerStatus[];
  total: number;
}
