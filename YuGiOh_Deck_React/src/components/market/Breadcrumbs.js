import Link from 'next/link';
import styles from './market.module.css';

/** items: [{ label, href? }]. The last item has no href and marks the current page. */
export default function Breadcrumbs({ items }) {
    return (
        <nav aria-label="Breadcrumb">
            <ol className={styles.crumbs}>
                {items.map((item, index) => (
                    <li key={`${index}-${item.label}`} aria-current={item.href ? undefined : 'page'}>
                        {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
                        {index < items.length - 1 && <span aria-hidden="true" className={styles.crumbSeparator}>›</span>}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
