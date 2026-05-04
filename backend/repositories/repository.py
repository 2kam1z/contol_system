from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_
from sqlalchemy.orm import aliased

from backend.services.exporters import strip_tags
from backend.models.models import PageList, CountryList, InnerDictinary, ScriptContentType, CharList
from backend.schemas.satellite import SSatelliteOut, SSatellitePageOut
from backend.schemas.news import SNewsOut, SNewsPageOut

NEWS_ROOT_ID = 206


class SatellitesRepository:

    @staticmethod
    def _char_value_subq(id_char: int):
        char_unit = aliased(PageList)
        value_text = func.trim(
            func.concat_ws(
                " ",
                func.nullif(CharList.measurement_condition, ""),
                func.nullif(CharList.value, ""),
                func.nullif(char_unit.title_content, ""),
            )
        )
        link_text = func.trim(func.nullif(char_unit.title_content, ""))
        return (
            select(func.group_concat(func.coalesce(func.nullif(value_text, ""), link_text)))
            .select_from(CharList)
            .outerjoin(char_unit, CharList.id_link == char_unit.id_page)
            .where(
                CharList.id_page == PageList.id_page,
                CharList.id_char == id_char,
            )
            .scalar_subquery()
        )


    @classmethod
    async def find_satellites(
        cls,
        session: AsyncSession,
        id_type: int,
        query: str = "",
        limit: int = 6,
        offset: int = 0,
    ) -> SSatellitePageOut:

        paged_select = (
            select(
                PageList.id_page.label("id_page"),
                func.count().over().label("total"),
            )
            .join(ScriptContentType, PageList.id_page == ScriptContentType.id_page)
            .where(ScriptContentType.id_type == id_type)
            .group_by(PageList.id_page)
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
            .subquery("paged")
        )

        mass_subq = (
            select(CharList.value)
            .where(
                CharList.id_page == PageList.id_page,
                CharList.id_char == 68,
            )
            .limit(1)
            .scalar_subquery()
            .label("mass")
        )
        frequency_range_subq = cls._char_value_subq(116421).label("frequency_range")
        resolution_subq = cls._char_value_subq(119).label("resolution")
        radiometric_sensitivity_subq = cls._char_value_subq(114611).label("radiometric_sensitivity")

        stmt = (
            select(
                PageList,
                InnerDictinary.name.label("country_name"),
                paged.c.total,
                mass_subq,
                frequency_range_subq,
                resolution_subq,
                radiometric_sensitivity_subq,
            )
            .join(paged, PageList.id_page == paged.c.id_page)
            .outerjoin(CountryList, PageList.id_page == CountryList.id_page)
            .outerjoin(InnerDictinary, CountryList.id_country == InnerDictinary.id_row)
            .order_by(PageList.id_page)
        )

        result = await session.execute(stmt)
        rows = result.all()

        total = 0
        grouped: dict[int, SSatelliteOut] = {}
        for (
            page,
            country_name,
            row_total,
            mass,
            frequency_range,
            resolution,
            radiometric_sensitivity,
        ) in rows:
            total = row_total
            if page.id_page not in grouped:
                grouped[page.id_page] = SSatelliteOut(
                    id_page=page.id_page,
                    title_content=page.title_content,
                    img=page.img,
                    small_content=strip_tags(page.small_content),
                    big_content=strip_tags(page.big_content),
                    country=[],
                    mass=mass,
                    frequency_range=frequency_range,
                    resolution=resolution,
                    radiometric_sensitivity=radiometric_sensitivity,
                )
            if country_name and country_name not in grouped[page.id_page].country:
                grouped[page.id_page].country.append(country_name)

        return SSatellitePageOut(items=list(grouped.values()), total=total)


    @classmethod
    async def find_one_satellite(cls, session: AsyncSession, page_id: int) -> SSatelliteOut | None:
        stmt = (
            select(PageList, InnerDictinary.name.label('country_name'))
            .outerjoin(CountryList, PageList.id_page == CountryList.id_page)
            .outerjoin(InnerDictinary, CountryList.id_country == InnerDictinary.id_row)
            .where(PageList.id_page == page_id)
        )
        result = await session.execute(stmt)
        rows = result.all()
        if not rows:
            return None

        chars_result = await session.execute(
            select(
                (
                    select(CharList.value)
                    .where(
                        CharList.id_page == PageList.id_page,
                        CharList.id_char == 68,
                    )
                    .limit(1)
                    .scalar_subquery()
                    .label("mass")
                ),
                cls._char_value_subq(116421).label("frequency_range"),
                cls._char_value_subq(119).label("resolution"),
                cls._char_value_subq(114611).label("radiometric_sensitivity"),
            )
            .where(PageList.id_page == page_id)
        )
        mass, frequency_range, resolution, radiometric_sensitivity = chars_result.one()

        page, _ = rows[0]
        countries: list[str] = []
        for _, c in rows:
            if c and c not in countries:
                countries.append(c)
        return SSatelliteOut(
            id_page=page.id_page,
            title_content=page.title_content,
            img=page.img,
            small_content=strip_tags(page.small_content),
            big_content=strip_tags(page.big_content),
            country=countries,
            mass=mass,
            frequency_range=frequency_range,
            resolution=resolution,
            radiometric_sensitivity=radiometric_sensitivity,
        )


class NewsRepository:


    @classmethod
    async def find_news(cls, session: AsyncSession, limit: int = 5, offset: int = 0) -> SNewsPageOut:

        news_tree = (
            select(PageList.id_page)
            .where(PageList.id_page == NEWS_ROOT_ID)
            .cte(name="news_tree", recursive=True)
        )

        news_tree = news_tree.union_all(
            select(PageList.id_page)
            .where(PageList.id_parent == news_tree.c.id_page)
        )

        base_filter = and_(
            PageList.id_page.in_(select(news_tree.c.id_page)),
            PageList.id_page != NEWS_ROOT_ID,
        )

        total_result = await session.execute(
            select(func.count())
            .select_from(PageList)
            .where(base_filter)
        )
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
                small_content=page.small_content,
                big_content=page.big_content,
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


