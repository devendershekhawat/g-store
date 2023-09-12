import { Breadcrumb } from "antd";
import Link from "next/link";

type BreadcrubProps = {
    path: string;
}

export default function Breadcrumbs({ path }: BreadcrubProps) {
    // root/images/v-images
    const pathSegements = path.split('/'); ['root', 'images', 'v-images']
    return (
        <Breadcrumb
            items={pathSegements.map(item => {
                const index = pathSegements.indexOf(item); // 1
                const arrayUptoItem = pathSegements.slice(0, index + 1);
                const href = `/mystore/${arrayUptoItem.join('/')}`
                return {
                    title: <Link href={href}>{item}</Link>
                }
            })}
        />
    )
}