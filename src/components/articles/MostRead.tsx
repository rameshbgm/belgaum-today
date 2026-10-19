import { ArticleViewCount } from './ArticleViewCount';
import { PublisherLink } from './PublisherLink';
import { PublisherMetadata } from './PublisherMetadata';
interface MostReadArticle { id: number; title: string; slug: string; source_name: string; source_url: string; view_count?: number; }
export function MostRead({ articles }: { articles: MostReadArticle[] }) {
    return <ol className="most-read">{articles.map(article => <li key={article.id}><div><h3><PublisherLink article={article}>{article.title}</PublisherLink></h3><div className="story-metadata mt-2"><PublisherMetadata article={article} /><ArticleViewCount count={article.view_count ?? 0} /></div></div></li>)}</ol>;
}
