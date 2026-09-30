import styles from './market.module.css';

/** The dark page shell every market page shares: background, space under the fixed navbar, and the terminal font. */
export default function MarketPage({ children }) {
    return <div className={styles.page}>{children}</div>;
}
