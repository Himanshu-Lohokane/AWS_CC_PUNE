import dynamic from 'next/dynamic'
import Nav from '@/components/Nav'
import ScrollReveal from '@/components/ScrollReveal'

// Load fluid canvas only client-side (needs browser APIs)
const FluidCanvas = dynamic(() => import('@/components/FluidCanvas'), { ssr: false })

export default function Home () {
  return (
    <>
      <FluidCanvas />

      <div className="page">
        {/* ── NAV ── */}
        <Nav />

        {/* ════════════════════════════════
            HERO
        ════════════════════════════════ */}
        <section id="hero" className="hero">
          <div className="hero-content">
            <div className="eyebrow-pill">
              <div className="pulse-dot" />
              AWS Cloud Club · ADYPSOE
            </div>

            <h1 className="hero-h1">
              Learn.<br />
              <span className="purple">Build.</span><br />
              Innovate.
            </h1>

            <p className="hero-sub">
              A student-led community at Ajeenkya DY Patil School of Engineering, Pune —
              turning beginners into cloud builders on AWS.
            </p>

            <div className="hero-btns">
              <a href="#join" className="btn-primary">Join the Club</a>
              <a href="#events" className="btn-ghost">View Events</a>
            </div>
          </div>

          <div className="scroll-hint">
            <div className="scroll-line" />
            Scroll
          </div>
        </section>

        {/* ════════════════════════════════
            ABOUT
        ════════════════════════════════ */}
        <div className="opaque">
          <div className="section" id="about">
            <div className="about-grid">
              <ScrollReveal>
                <p className="sec-eye">About the Club</p>
                <h2 className="sec-h2">
                  Where Students Become<br />
                  <em>Cloud Builders</em>
                </h2>
                <p className="about-p">
                  AWS Cloud Club ADYPSOE is a student-led community at Ajeenkya DY Patil
                  School of Engineering, Pune — dedicated to helping engineering students
                  master AWS cloud technologies.
                </p>
                <p className="about-p">
                  From fundamentals to real-world projects, workshops, certifications,
                  hackathons, and industry networking — we turn beginners into cloud builders.
                  Join us to learn, build, and innovate on AWS ☁️
                </p>
                <div className="chips">
                  <div className="chip">☁️&nbsp; Hands-on Workshops</div>
                  <div className="chip">🏆&nbsp; Hackathons &amp; Quizzes</div>
                  <div className="chip">🎓&nbsp; AWS Certifications Guidance</div>
                  <div className="chip">🤝&nbsp; Industry Networking</div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={150}>
                <div className="about-cards">
                  <div className="about-card">
                    <div className="about-card-n">300<em>+</em></div>
                    <div className="about-card-l">Attendees at our largest session</div>
                  </div>
                  <div className="about-card">
                    <div className="about-card-n">2<em>+</em></div>
                    <div className="about-card-l">Expert-led events since launch</div>
                  </div>
                  <div className="about-card">
                    <div className="about-card-n">AWS<em>+</em></div>
                    <div className="about-card-l">Official Cloud Club at ADYPSOE</div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════
            UPCOMING EVENTS
        ════════════════════════════════ */}
        <div className="opaque-purple">
          <div className="section" id="events">
            <ScrollReveal>
              <div className="sec-head">
                <p className="sec-eye">What&apos;s Next</p>
                <h2 className="sec-h2">Upcoming Events</h2>
                <p className="sec-sub">
                  Stay tuned for expert sessions, workshops, and community events.
                </p>
              </div>
            </ScrollReveal>

            <div className="events-grid">
              <ScrollReveal delay={100}>
                <div className="ev-card">
                  <div className="ev-badge badge-go">Confirmed</div>
                  <div className="ev-date">📅 March 28, 2026</div>
                  <div className="ev-title">MoltBot / ClawDBot: Run Your Own AI Agent</div>
                  <div className="ev-desc">
                    Hands-on workshop: Deploy and run your own autonomous AI agent on Amazon EC2.
                    Learn how to manage compute resources for AI workloads.
                  </div>
                  <a
                    href="mailto:awsadypsoe@gmail.com"
                    className="ev-link"
                  >
                    Register Interest →
                  </a>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <div className="ev-card">
                  <div className="ev-badge badge-go">Confirmed</div>
                  <div className="ev-date">📅 March 21, 2026</div>
                  <div className="ev-title">AWS Community Day Pune 2026</div>
                  <div className="ev-desc">
                    Joining hands with AWS User Group Pune for a full-day community event
                    packed with sessions, hands-on labs, and networking.
                  </div>
                  <a
                    href="https://www.meetup.com/aws-cloud-club-at-ajeenky-d-y-patil-school-of-engineering/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ev-link"
                  >
                    RSVP on Meetup →
                  </a>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <div className="ev-card soon">
                  <div className="ev-badge badge-soon">Coming Soon</div>
                  <div className="ev-date">📅 April 2026</div>
                  <div className="ev-title">Deep Dive: AWS Lambda &amp; Serverless</div>
                  <div className="ev-desc">
                    From zero to serverless — a hands-on session on Lambda, API Gateway,
                    and event-driven architectures.
                  </div>
                  <a href="mailto:awsadypsoe@gmail.com" className="ev-link">
                    Register Interest →
                  </a>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════
            PAST EVENTS
        ════════════════════════════════ */}
        <div className="opaque">
          <div className="section" id="gallery">
            <ScrollReveal>
              <div className="sec-head">
                <p className="sec-eye">What We&apos;ve Done</p>
                <h2 className="sec-h2">Past Events</h2>
                <p className="sec-sub">
                  We hit the ground running. Here&apos;s a glimpse of what we&apos;ve been up to.
                </p>
              </div>
            </ScrollReveal>

            <div className="past-grid">
              <ScrollReveal delay={100}>
                <div className="past-card">
                  <div className="past-thumb past-thumb-1">🚀</div>
                  <div className="past-body">
                    <div className="past-date">FEB 6, 2026</div>
                    <div className="past-title">Inaugural Ceremony</div>
                    <div className="past-desc">
                      AWS Cloud Club ADYPSOE officially launched with expert talks, live
                      demos, quiz rounds, and a lot of cloud energy.
                    </div>
                    <div className="past-meta">
                      <span className="meta-tag">150 Attendees</span>
                      <span className="meta-tag">Launch Event</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <div className="past-card">
                  <div className="past-thumb past-thumb-2">⚡</div>
                  <div className="past-body">
                    <div className="past-date">FEB 26, 2026</div>
                    <div className="past-title">From Localhost to Cloud: Understanding EC2</div>
                    <div className="past-desc">
                      Expert session by Afreen Bano (AWS Cloud Architect &amp; DevSecOps
                      Leader). Bridging local dev to production cloud environments.
                    </div>
                    <div className="past-meta">
                      <span className="meta-tag">300+ Attendees</span>
                      <span className="meta-tag">Expert Session</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════
            PARTNERS
        ════════════════════════════════ */}
        <div className="opaque-purple">
          <div className="section" id="partners">
            <ScrollReveal>
              <div className="sec-head">
                <p className="sec-eye">Our Community</p>
                <h2 className="sec-h2">Partners &amp; Affiliations</h2>
              </div>
            </ScrollReveal>

            <div className="partners-grid">
              <ScrollReveal delay={100}>
                <div className="partner-card">
                  <div className="partner-label">Official Program</div>
                  <div className="partner-name">
                    <span className="o">aws</span> Cloud Clubs
                  </div>
                  <div className="partner-desc">
                    AWS Cloud Clubs is Amazon&apos;s official student community program —
                    empowering students worldwide to build cloud skills and connect with the
                    global AWS ecosystem.
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <div className="partner-card">
                  <div className="partner-label">Community Partner</div>
                  <div className="partner-name">
                    <span className="o">aws</span> User Group Pune
                  </div>
                  <div className="partner-desc">
                    AWS User Group Pune is the city&apos;s premier cloud community, led by
                    industry veterans. We collaborate on events like AWS Community Day to
                    bring Pune&apos;s cloud builders together.
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════
            JOIN CTA
        ════════════════════════════════ */}
        <div className="opaque">
          <div className="section" id="join">
            <ScrollReveal>
              <div className="join-card">
                <p className="sec-eye">Ready to Start?</p>
                <h2 className="join-h2">Join the Club. Build on Cloud.</h2>
                <p className="join-sub">
                  Connect with Pune&apos;s newest AWS student community. Stay updated
                  with events, resources, and opportunities to grow.
                </p>
                <div className="join-btns">
                  <a
                    href="https://www.meetup.com/aws-cloud-club-at-ajeenky-d-y-patil-school-of-engineering/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Join on Meetup
                  </a>
                  <a
                    href="https://chat.whatsapp.com/Dp1pWeZUSmqLecTTHAdHNp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                  >
                    WhatsApp Community
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* ════════════════════════════════
            FOOTER — always dark
        ════════════════════════════════ */}
        <footer>
          <div className="footer-inner">
            <div className="footer-top">
              <div>
                <div className="logo">
                  <span className="footer-logo-aws">aws</span>
                  <div className="logo-sep footer-logo-sep" />
                  <div className="logo-meta">
                    <span className="footer-logo-club">Cloud Clubs</span>
                    <span className="footer-logo-inst">ADYPSOE</span>
                    <div className="logo-bar">
                      <div className="logo-bar-main" />
                      <div className="logo-bar-dot" />
                    </div>
                  </div>
                </div>
                <p className="footer-tagline">Learn &bull; Build &bull; Innovate</p>
              </div>

              <div>
                <div className="footer-social-label">Stay Connected</div>
                <div className="footer-socials">
                  <a href="https://www.instagram.com/aws.adypsoe/" target="_blank" rel="noopener noreferrer">Instagram</a>
                  <a href="https://www.linkedin.com/company/111789072/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                  <a href="https://www.meetup.com/aws-cloud-club-at-ajeenky-d-y-patil-school-of-engineering/" target="_blank" rel="noopener noreferrer">Meetup</a>
                  <a href="https://chat.whatsapp.com/Dp1pWeZUSmqLecTTHAdHNp" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                </div>
              </div>
            </div>

            <div className="footer-div" />

            <div className="footer-bot">
              <p>AWS Cloud Club &bull; Ajeenkya DY Patil School of Engineering, Pune, Maharashtra</p>
              <p><a href="mailto:awsadypsoe@gmail.com">awsadypsoe@gmail.com</a></p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
