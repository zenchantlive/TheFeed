export default function PrivacyPage() {
    return (
        <div className="container max-w-3xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

            <div className="prose dark:prose-invert max-w-none space-y-6">
                <p className="text-muted-foreground">Last Updated: December 2025</p>

                <section>
                    <h2 className="text-xl font-semibold mb-3">1. Our Commitment</h2>
                    <p>
                        Your privacy is not an afterthought; it is our core feature. We connect neighbors without compromising personal safety or dignity.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">2. Location Data</h2>
                    <p>
                        We use your location to show you relevant resources and events. <strong>We do not sell your location data.</strong> We do not store a history of your precise movements.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">3. Anonymity for Resource Seekers</h2>
                    <p>
                        We do not require you to create an account or provide a real name to access crisis resources (food banks, pantries). Your search for food is private.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">4. Information We Collect</h2>
                    <p>
                        When you create an account, we collect your email and a display name. If you post events or share food, that specific data is public to your local neighborhood network.
                    </p>
                </section>
            </div>
        </div>
    );
}
