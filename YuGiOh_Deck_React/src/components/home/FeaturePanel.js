import React, { memo } from 'react';
import Link from 'next/link';
import NavVideoCard from '@/components/NavVideoCard';
import { videoUrl } from './homeData';

/**
 * One scroll panel (image card + text). The left and right versions used to be two copies of the
 * same markup; now `imgRight` just changes the column order on wide screens.
 */
function FeaturePanel({ panel }) {
    const { id, imgRight } = panel;

    return (
        <section
            data-bg={id}
            aria-labelledby={`${id}-title`}
            className="md-content-panel home-panel position-relative mb-4 mb-md-5 shadow-lg"
        >
            <div className="position-relative w-100 py-4 py-md-5 px-3 px-md-4">
                <div className="row align-items-center mx-0 w-100">
                    <div className={`col-md-5 mb-3 mb-md-0 d-flex justify-content-center ${imgRight ? 'offset-md-1 justify-content-md-end order-md-2' : 'justify-content-md-start'}`}>
                        <div className="home-panel__card">
                            <NavVideoCard link={{ path: panel.navPath, label: panel.navLabel, img: panel.navImg, video: videoUrl(panel.navVideo) }} />
                        </div>
                    </div>

                    <div className={`col-md-6 text-center text-md-start ${imgRight ? 'order-md-1' : 'offset-md-1'}`}>
                        <h2 id={`${id}-title`} className="home-panel__title fw-bold mb-2 mb-md-3">
                            <span className={panel.warm ? 'text-warning' : undefined}>{panel.title}</span>
                        </h2>
                        <p className="home-panel__desc text-white mb-3 mb-md-4">{panel.desc}</p>
                        <h3 className="home-panel__sub text-white fw-bold mb-2 border-bottom border-info border-2 d-inline-block pb-1">{panel.subTitle}</h3>
                        <p className="text-white-50 small mt-1 mb-3">{panel.subDesc}</p>
                        <Link href={panel.navPath} className="home-panel__link terminal-font">{panel.cta} →</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default memo(FeaturePanel);
