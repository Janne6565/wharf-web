import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ProjectSummary } from "@/api/generated/model";
import { Alert } from "@/components/Alert";
import { roleLabelKey } from "@/lib/projectRole";

interface ProjectListProps {
  readonly projects: readonly ProjectSummary[];
  readonly loading: boolean;
  readonly error: boolean;
}

export function ProjectList({ projects, loading, error }: ProjectListProps) {
  const { t } = useTranslation();
  if (loading) {
    return <p className="py-6 text-center text-[13px] text-dim">{t("projectDetail.loading")}</p>;
  }
  if (error) {
    return <Alert tone="danger">{t("projects.errors.loadFailed")}</Alert>;
  }
  if (projects.length === 0) {
    return <p className="py-6 text-center text-[13px] text-muted">{t("projects.empty")}</p>;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {projects.map((project) => (
        <ProjectRow key={project.id} project={project} />
      ))}
    </div>
  );
}

function ProjectRow({ project }: { readonly project: ProjectSummary }) {
  const { t } = useTranslation();
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id ?? "" }}
      data-testid={`project-${project.id}`}
      className="group flex items-center gap-3 border border-border bg-input px-4 py-3 hover:border-accent"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2.5">
          <span className="truncate text-[14px] text-text">{project.name}</span>
          <span className="flex-none text-[11.5px] text-dim">{t(roleLabelKey(project.role))}</span>
        </div>
        {project.description ? (
          <div className="truncate text-[12.5px] text-dim">{project.description}</div>
        ) : null}
        <div className="mt-0.5 flex gap-3 text-[11.5px] text-dim">
          <span>{t("projects.memberCount", { count: project.memberCount ?? 0 })}</span>
          {project.awaitingKey ? (
            <span className="text-warn">{t("projects.awaitingAccess")}</span>
          ) : null}
        </div>
      </div>
      <ChevronRight size={16} className="flex-none text-dim group-hover:text-accent" aria-hidden />
    </Link>
  );
}
