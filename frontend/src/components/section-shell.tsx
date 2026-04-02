import { PageHeader } from "@/components/page-header";

type SectionShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  meta?: string[];
  action?: React.ReactNode;
  children?: React.ReactNode;
};

function SectionShell({
  eyebrow,
  title,
  description,
  meta,
  action,
  children,
}: SectionShellProps) {
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        meta={meta}
        action={action}
      />
      {children ? children : null}
    </section>
  );
}

export { SectionShell };
