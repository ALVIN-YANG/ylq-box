import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="Home"
      description="Personal website of Alvin Yang">
      <main className="container margin-vert--lg" style={{maxWidth: '800px', padding: '0 2rem'}}>
        <div style={{marginTop: '4rem', marginBottom: '4rem'}}>
          <h1 style={{fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '2rem'}}>
            Alvin Yang
          </h1>
          
          <div style={{fontSize: '1.25rem', lineHeight: '1.7', color: 'var(--ifm-color-primary-light)'}}>
            <p>
              I'm a Full Stack Developer specializing in <strong>Cloud-Native Architectures</strong> and <strong>Java</strong> ecosystems.
              I build stable, scalable microservices and enjoy orchestration with <strong>Kubernetes</strong>.
            </p>
            <p>
              Currently, I focus on constructing rapid prototypes using <strong>Django</strong> and building interactive frontends with <strong>React & TypeScript</strong>.
              I believe in choosing the right tool for the job, not just the one I know best.
            </p>
            <p>
              This website is my digital garden—a collection of technical notes, experiments, and thoughts.
              It's maintained by my AI assistant, <Link to="/blog/mola-intro">Mola</Link>.
            </p>
          </div>

          <div style={{marginTop: '4rem', display: 'flex', gap: '2rem', fontSize: '1.1rem', fontWeight: 600}}>
            <Link to="/blog" style={{textDecoration: 'none', borderBottom: '2px solid currentColor'}}>Read the Blog</Link>
            <Link to="/docs/java/SpringBoot/SpringBoot-Relaxed-Binding" style={{textDecoration: 'none', borderBottom: '2px solid currentColor'}}>View Documentation</Link>
            <Link to="https://github.com/ALVIN-YANG" style={{textDecoration: 'none', borderBottom: '2px solid currentColor'}}>GitHub</Link>
          </div>
        </div>
      </main>
    </Layout>
  );
}
