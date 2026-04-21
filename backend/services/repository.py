from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_

from backend.services.exporters import strip_tags
from backend.models.models import PageList, CountryList, InnerDictinary
from backend.schemas.satellite import SSatelliteOut, SSatellitePageOut
from backend.schemas.news import SNewsOut, SNewsPageOut


class SatellitesRepository:


    @classmethod
    async def find_satellites(
        cls,
        session: AsyncSession,
        parent_id: int,
        query: str = "",
        limit: int = 6,
        offset: int = 0,
    ) -> SSatellitePageOut:

        anchor = select(PageList.id_page).where(PageList.id_parent == parent_id)
        descendants = anchor.cte(name='descendants', recursive=True)
        recursive_part = select(PageList.id_page).where(PageList.id_parent == descendants.c.id_page)
        descendants = descendants.union_all(recursive_part)

        paged_select = (
            select(
                PageList.id_page.label('id_page'),
                func.count().over().label('total'),
            )
            .where(PageList.id_page.in_(select(descendants.c.id_page)))
        )
        if query:
            pattern = f"%{query}%"
            country_match = (
                select(CountryList.id_page)
                .join(InnerDictinary, CountryList.id_country == InnerDictinary.id_row)
                .where(InnerDictinary.name.ilike(pattern))
            )
            paged_select = paged_select.where(
                or_(
                    PageList.title_content.ilike(pattern),
                    PageList.small_content.ilike(pattern),
                    PageList.big_content.ilike(pattern),
                    PageList.id_page.in_(country_match),
                )
            )

        paged = (
            paged_select
            .order_by(PageList.id_page)
            .limit(limit)
            .offset(offset)
            .subquery('paged')
        )

        stmt = (
            select(PageList, InnerDictinary.name.label('country_name'), paged.c.total)
            .join(paged, PageList.id_page == paged.c.id_page)
            .outerjoin(CountryList, PageList.id_page == CountryList.id_page)
            .outerjoin(InnerDictinary, CountryList.id_country == InnerDictinary.id_row)
            .order_by(PageList.id_page)
        )
        result = await session.execute(stmt)
        rows = result.all()

        total = 0
        grouped: dict[int, SSatelliteOut] = {}
        for page, country_name, row_total in rows:
            total = row_total
            if page.id_page not in grouped:
                grouped[page.id_page] = SSatelliteOut(
                    id_page=page.id_page,
                    title_content=page.title_content,
                    img=page.img,
                    small_content=strip_tags(page.small_content),
                    big_content=strip_tags(page.big_content),
                    source=page.source,
                    country=[],
                    is_civ=page.is_civ,
                    is_com=page.is_com,
                )
            if country_name and country_name not in grouped[page.id_page].country:
                grouped[page.id_page].country.append(country_name)

        return SSatellitePageOut(items=list(grouped.values()), total=total)


    @classmethod
    async def find_one_satellite(cls, session: AsyncSession, page_id: int) -> SSatelliteOut | None:
        query = (
            select(PageList, InnerDictinary.name.label('country_name'))
            .outerjoin(CountryList, PageList.id_page == CountryList.id_page)
            .outerjoin(InnerDictinary, CountryList.id_country == InnerDictinary.id_row)
            .where(PageList.id_page == page_id)
        )
        result = await session.execute(query)
        rows = result.all()
        if not rows:
            return None

        page, _ = rows[0]
        countries = [c for _, c in rows if c]
        return SSatelliteOut(
            id_page=page.id_page,
            title_content=page.title_content,
            img=page.img,
            small_content=strip_tags(page.small_content),
            big_content=strip_tags(page.big_content),
            source=page.source,
            country=countries,
            is_civ=page.is_civ,
            is_com=page.is_com,
        )


class NewsRepository:


    @classmethod
    async def find_news(cls, session: AsyncSession, limit: int = 5, offset: int = 0) -> SNewsPageOut:

        base_filter = and_(PageList.small_content.isnot(None), PageList.big_content.isnot(None), PageList.source.isnot(None))

        total_result = await session.execute(select(func.count()).select_from(PageList).where(base_filter))
        total = total_result.scalar_one()

        query = (
            select(PageList)
            .where(base_filter)
            .order_by(PageList.dte.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await session.execute(query)
        pages = result.scalars().all()

        items = [
            SNewsOut(
                id_page=page.id_page,
                title_content=page.title_content,
                img=page.img,
                small_content=strip_tags(page.small_content),
                big_content=strip_tags(page.big_content),
                source=page.source,
                dte=page.dte
            )
            for page in pages
        ]
        return SNewsPageOut(items=items, total=total)


    @classmethod
    async def find_one_news(cls, session: AsyncSession, page_id: int) -> SNewsOut | None:
        query = select(PageList).where(PageList.id_page == page_id)
        result = await session.execute(query)
        page = result.scalars().first()
        if not page:
            return None
        return SNewsOut(
            id_page=page.id_page,
            title_content=page.title_content,
            img=page.img,
            small_content=strip_tags(page.small_content),
            big_content=strip_tags(page.big_content),
            source=page.source,
            dte=page.dte
        )




